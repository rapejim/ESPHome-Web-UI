#pragma once

#include "esphome/core/component.h"
#include "esphome/core/preferences.h"
#include "esphome/components/web_server_base/web_server_base.h"

#include <atomic>
#include <cstddef>
#include <cstdint>

namespace esphome::dashboard_storage {

class DashboardStorage : public Component, public AsyncWebHandler {
 public:
  void setup() override;
  void dump_config() override;
  float get_setup_priority() const override;

  bool canHandle(AsyncWebServerRequest *request) const override;
  void handleRequest(AsyncWebServerRequest *request) override;
  void handleBody(AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index,
                  size_t total) override;

 protected:
  static constexpr size_t MAX_CONFIG_SIZE = 768;
  static constexpr uint32_t PREFERENCE_KEY = 0xD45B3A21;
  static constexpr uint32_t CONFIG_MAGIC = 0x45535549;

  struct StoredConfig {
    uint32_t magic{0};
    uint16_t length{0};
    uint32_t checksum{0};
    char json[MAX_CONFIG_SIZE + 1]{};
  };

  ESPPreferenceObject preference_;
  StoredConfig stored_{};
  AsyncWebServerRequest *body_request_{nullptr};
  size_t body_length_{0};
  uint32_t body_checksum_{2166136261UL};
  bool body_invalid_{false};
  bool has_config_{false};
  std::atomic<bool> save_pending_{false};
};

}  // namespace esphome::dashboard_storage
