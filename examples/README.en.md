# ESP32 proof of concept

The PoC includes two board-specific configurations that share the same local frontend (`web/poc.js` and `web/poc.css`). Both examples use virtual sensors, a virtual switch and a virtual RGB light, so no external peripherals are required.

[Versión en español](README.md)

## Available examples

| File | Target board | Framework |
| --- | --- | --- |
| `esp32-basic.yaml` | ESP32 DevKit (classic ESP32) | Arduino |
| `esp32-c6-mini.yaml` | ESP32-C6 Super Mini (ESP32-C6 DevKitC-1 board definition) | ESP-IDF |

**ESP32-C6 note:** this example targets the common ESP32-C6 Super Mini variant. It uses `esp32-c6-devkitc-1` as the ESPHome/PlatformIO board definition and ESP-IDF. If your board is a different C6 Mini variant, check its exact model before flashing.

## Before compiling or flashing

Edit the YAML file for the example you intend to use:

1. Replace `REPLACE_WITH_WIFI_SSID` and `REPLACE_WITH_WIFI_PASSWORD` with your Wi-Fi credentials.
2. Change the web interface username and password. The committed values are demonstration placeholders and must not be used on a real network.
3. Keep the device on a trusted local network. This PoC uses HTTP Digest authentication but does not provide HTTPS.

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

Connect the board over USB for the first flash. After it joins Wi-Fi, open its IP address in a browser; the web server credentials will be requested.

## What to test

- Temperature and humidity update every five seconds.
- The switch can be turned on and off.
- The color picker sends red, green and blue values to the light.
- State changes and log messages arrive through Server-Sent Events on `/events`.
- All UI assets are served by the ESP32. The browser does not need a CDN or internet access.

## Implementation notes

ESPHome's version 2 web server builds a minimal HTML shell containing an `<esp-app>` element. With `js_url: ""` and `js_include`, the device serves our module at `/0.js`; the module defines the `esp-app` custom element and supplies the complete interface. `css_include` serves the stylesheet at `/0.css`.

The examples deliberately do not set `local: true`: that option embeds ESPHome's bundled frontend, whereas this PoC uses the configurable HTML shell and local include routes. Empty `js_url` and `css_url` values prevent external asset requests.

The PoC reuses ESPHome's existing APIs:

- `GET /events`: initial states, real-time updates and log messages.
- `POST /switch/{entity}/turn_on` and `turn_off`: switch control.
- `POST /light/{entity}/turn_on?r=...&g=...&b=...`: RGB light control.

The frontend uses `name_id` when available and falls back to `id`, maintaining compatibility with ESPHome's entity identifier transition.
