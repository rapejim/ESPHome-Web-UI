# ESP32 proof of concept

The PoC includes two board-specific configurations that share the same local frontend (web/poc.js and web/poc.css). Both examples use virtual sensors, a virtual switch and a virtual RGB light, so no external peripherals are required.

## Available board examples

| Example | Target | Framework |
| --- | --- | --- |
| esp32-basic.yaml | ESP32 DevKit (classic ESP32) | Arduino |
| esp32-c6-mini.yaml | ESP32-C6 Super Mini (using the ESP32-C6 DevKitC-1 board definition) | ESP-IDF |

**ESP32-C6 note:** the C6 example targets the commonly sold ESP32-C6 Super Mini. It uses esp32-c6-devkitc-1 as the ESPHome/PlatformIO board definition and the required ESP-IDF framework. If your board is a different C6 Mini variant, check its exact model before flashing.

## Before compiling or flashing

For the example you intend to use:

1. Replace REPLACE_WITH_WIFI_SSID and REPLACE_WITH_WIFI_PASSWORD with your Wi-Fi credentials.
2. Change the web interface username and password. The committed values are demonstration placeholders and must not be used on a real network.
3. Keep the device on a trusted local network; this PoC uses HTTP Digest authentication but does not provide HTTPS.

## Build with ESPHome

Run the commands for your board from the repository root.

Classic ESP32:

```bash
esphome config examples/esp32-basic.yaml
esphome compile examples/esp32-basic.yaml
esphome run examples/esp32-basic.yaml
```

ESP32-C6 Mini:

```bash
esphome config examples/esp32-c6-mini.yaml
esphome compile examples/esp32-c6-mini.yaml
esphome run examples/esp32-c6-mini.yaml
```

Connect the board over USB for the first flash. After it joins Wi-Fi, open its IP address in a browser; the browser will ask for the web server credentials.

## What to test

- Temperature and humidity update every five seconds.
- The switch can be turned on and off.
- The RGB color picker sends red, green and blue values to the light.
- State changes arrive through the /events Server-Sent Events connection.
- All UI assets are served by the ESP32. The page does not need a CDN or external internet access.

## Implementation notes

ESPHome's version 2 web server builds a small HTML shell containing an esp-app element. With empty js_url and js_include, the device serves our module at /0.js; our module defines the esp-app custom element and supplies the complete interface. css_include serves the stylesheet at /0.css.

The examples deliberately do not set local: true: that option embeds ESPHome's bundled frontend HTML, whereas this PoC uses the configurable HTML shell and local include routes. Empty js_url and css_url values prevent external asset requests.

The PoC reuses ESPHome's existing API:

- GET /events: initial entity states and real-time state updates.
- POST /switch/{entity}/turn_on and turn_off: switch control.
- POST /light/{entity}/turn_on?r=...&g=...&b=...: RGB light control.

The frontend reads name_id when present and falls back to id, accommodating ESPHome's entity identifier transition.
