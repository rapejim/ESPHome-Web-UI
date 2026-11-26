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

  // Register before web_server starts; WebServerBase applies the configured Digest auth.
  web_server_base::global_web_server_base->add_handler(this);
  ESP_LOGCONFIG(TAG, "Dashboard configuration storage ready (max %u bytes)", MAX_CONFIG_SIZE);
}

float DashboardStorage::get_setup_priority() const {
  // Register the route before web_server initializes the shared HTTP server.
  return setup_priority::WIFI - 2.0f;
}

bool DashboardStorage::canHandle(web_server_base::AsyncWebServerRequest *request) const {
  std::array<char, web_server_base::AsyncWebServerRequest::URL_BUF_SIZE> url{};
  const auto path = request->url_to(url);
  return path == "/dashboard-config" &&
         (request->method() == HTTP_GET || request->method() == HTTP_POST);
}

void DashboardStorage::handleBody(web_server_base::AsyncWebServerRequest *request, uint8_t *data, size_t len,
                                  size_t index, size_t total) {
  if (index == 0) {
    this->body_request_ = request;
    this->body_length_ = 0;
    this->body_invalid_ = total == 0 || total > MAX_CONFIG_SIZE;
  }
  if (this->body_request_ != request || this->body_invalid_) return;
  if (index != this->body_length_ || len > MAX_CONFIG_SIZE - this->body_length_) {
    this->body_invalid_ = true;
    return;
  }
  std::memcpy(this->stored_.json + this->body_length_, data, len);
  this->body_length_ += len;
}

void DashboardStorage::handleRequest(web_server_base::AsyncWebServerRequest *request) {
  if (request->method() == HTTP_GET) {
    if (!this->has_config_) {
      request->send(404, "application/json", "{}");
      return;
    }
    request->send(200, "application/json", this->stored_.json);
    return;
  }

  const size_t content_length = request->contentLength();
  if (this->body_invalid_ || this->body_request_ != request || content_length == 0 ||
      content_length > MAX_CONFIG_SIZE || content_length != this->body_length_ ||
      this->stored_.json[0] != '{' || this->stored_.json[this->body_length_ - 1] != '}') {
    this->body_request_ = nullptr;
    request->send(400, "application/json", "{\"error\":\"invalid or oversized configuration\"}");
    return;
  }

  this->stored_.json[this->body_length_] = '\0';
  this->stored_.magic = CONFIG_MAGIC;
  this->stored_.length = static_cast<uint16_t>(this->body_length_);

  if (!this->has_config_ || this->preference_.save(&this->stored_)) {
    this->has_config_ = true;
    this->body_request_ = nullptr;
    request->send(204);
    return;
  }

  this->body_request_ = nullptr;
  request->send(500, "application/json", "{\"error\":\"could not persist configuration\"}");
}

void DashboardStorage::dump_config() {
  ESP_LOGCONFIG(TAG, "Dashboard configuration storage");
}

}  // namespace esphome::dashboard_storage
