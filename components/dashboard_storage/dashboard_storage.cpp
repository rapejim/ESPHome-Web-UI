#include "dashboard_storage.h"

#include "esphome/core/log.h"

#include <array>
#include <cstring>

namespace esphome::dashboard_storage {

static const char *const TAG = "dashboard_storage";

void DashboardStorage::setup() {
  if (global_preferences == nullptr || web_server_base::global_web_server_base == nullptr) {
    ESP_LOGE(TAG, "Preferences or web server is not available");
    this->mark_failed();
    return;
  }

  this->preference_ = global_preferences->make_preference<StoredConfig>(PREFERENCE_KEY);
  if (this->preference_.load(&this->stored_) && this->stored_.magic == CONFIG_MAGIC &&
      this->stored_.length > 0 && this->stored_.length <= MAX_CONFIG_SIZE &&
      this->stored_.json[this->stored_.length] == '\0') {
    this->has_config_ = true;
  } else {
    this->stored_ = StoredConfig{};
  }

  // Register before web_server starts; WebServerBase applies the configured authentication.
  web_server_base::global_web_server_base->add_handler(this);
  ESP_LOGCONFIG(TAG, "Dashboard configuration storage ready (max %u bytes)", MAX_CONFIG_SIZE);
}

float DashboardStorage::get_setup_priority() const {
  // Register the route before web_server initializes the shared HTTP server.
  return setup_priority::WIFI - 2.0f;
}

bool DashboardStorage::canHandle(AsyncWebServerRequest *request) const {
  std::array<char, AsyncWebServerRequest::URL_BUF_SIZE> url{};
  const auto path = request->url_to(url);
  return path == "/dashboard-config" &&
         (request->method() == HTTP_GET || request->method() == HTTP_POST);
}

void DashboardStorage::handleBody(AsyncWebServerRequest *request, uint8_t *data, size_t len,
                                  size_t index, size_t total) {
  if (index == 0) {
    this->body_request_ = request;
    if (this->save_pending_) {
      this->body_invalid_ = true;
      return;
    }
    this->body_length_ = 0;
    this->body_invalid_ = total == 0 || total > MAX_CONFIG_SIZE;
    this->body_checksum_ = 2166136261UL;
  }
  if (this->body_request_ != request || this->body_invalid_) return;
  if (index != this->body_length_ || len > MAX_CONFIG_SIZE - this->body_length_) {
    this->body_invalid_ = true;
    return;
  }
  std::memcpy(this->stored_.json + this->body_length_, data, len);
  for (size_t i = 0; i < len; i++) this->body_checksum_ = (this->body_checksum_ ^ data[i]) * 16777619UL;
  this->body_length_ += len;
}

void DashboardStorage::handleRequest(AsyncWebServerRequest *request) {
  if (request->method() == HTTP_GET) {
    if (!this->has_config_) {
      request->send(404, "application/json", "{}");
      return;
    }
    request->send(200, "application/json", this->stored_.json);
    return;
  }

  if (this->save_pending_) {
    request->send(503, "application/json", R"({"error":"configuration save in progress"})");
    return;
  }

  const size_t content_length = request->contentLength();
  if (this->body_invalid_ || this->body_request_ != request || content_length == 0 ||
      content_length > MAX_CONFIG_SIZE || content_length != this->body_length_ ||
      this->stored_.json[0] != '{' || this->stored_.json[this->body_length_ - 1] != '}') {
    this->body_request_ = nullptr;
    this->save_pending_ = true;
    this->defer([this]() {
      if (this->has_config_ && !this->preference_.load(&this->stored_)) {
        this->stored_ = StoredConfig{};
        this->has_config_ = false;
      } else if (!this->has_config_) {
        this->stored_ = StoredConfig{};
      }
      this->save_pending_ = false;
    });
    request->send(400, "application/json", R"({"error":"invalid or oversized configuration"})");
    return;
  }

  this->stored_.json[this->body_length_] = '\0';
  const bool changed = !this->has_config_ || this->stored_.length != this->body_length_ ||
                       this->stored_.checksum != this->body_checksum_;
  this->stored_.magic = CONFIG_MAGIC;
  this->stored_.length = static_cast<uint16_t>(this->body_length_);
  this->stored_.checksum = this->body_checksum_;
  this->body_request_ = nullptr;

  if (!changed) {
    request->send(204);
    return;
  }

  // ESPHome's preference queue is shared state: write and sync only on the main loop.
  this->save_pending_ = true;
  this->defer([this]() {
    if (!this->preference_.save(&this->stored_)) {
      ESP_LOGE(TAG, "Could not queue dashboard configuration");
      if (this->has_config_) this->preference_.load(&this->stored_);
      else this->stored_ = StoredConfig{};
    } else {
      this->has_config_ = true;
      if (!global_preferences->sync()) {
        ESP_LOGW(TAG, "Dashboard configuration queued but NVS sync failed");
      }
    }
    this->save_pending_ = false;
  });
  request->send(202, "application/json", R"({"status":"accepted"})");
}

void DashboardStorage::dump_config() {
  ESP_LOGCONFIG(TAG, "Dashboard configuration storage");
}

}  // namespace esphome::dashboard_storage
