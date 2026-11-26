# ESPHome Web UI

A reusable, self-hosted web interface for ESPHome devices.

The project aims to replace the native ESPHome web interface with a responsive UI served directly by the ESP32. Runtime assets are local to the device: no CDN, external fonts, JavaScript framework, or internet connection is required by the browser.

## Project goals

- Support common ESPHome entities: sensors, switches, lights, fans, climate and more.
- Work on mobile, tablet and desktop.
- Keep the interface independent from the physical hardware and entity configuration.
- Use native HTML, CSS and JavaScript with a small runtime footprint.
- Reuse ESPHome's existing HTTP, REST and Server-Sent Events APIs where practical.

## Current status

The project is in its proof-of-concept stage.

- Phase 1: repository scaffolding and GitHub Actions CI.
- Phase 2: ESP32 proof of concept using the built-in ESPHome web server, a local JavaScript module and local CSS.
- Phase 3: ESP32-C6 Mini example configuration, sharing the same PoC frontend.
- Later phases: reusable UI components, entity discovery/configuration, visual design system, broader board testing and releases.

## Proof of concept

The PoC currently includes two board-specific configurations:

- Classic ESP32 DevKit: [examples/esp32-basic.yaml](examples/esp32-basic.yaml)
- ESP32-C6 Mini: [examples/esp32-c6-mini.yaml](examples/esp32-c6-mini.yaml)
- Setup and flashing instructions: [examples/README.md](examples/README.md)
- Shared frontend module: [web/poc.js](web/poc.js)
- Shared stylesheet: [web/poc.css](web/poc.css)

Both examples demonstrate live temperature and humidity readings, a switch, and an RGB light. They use ESPHome's /events Server-Sent Events endpoint for state updates and its REST endpoints for control.

## Development principles

- No changes directly to main; work is submitted through pull requests.
- Keep commits small and focused.
- Avoid runtime dependencies and external network requests.
- Validate ESPHome examples and compile firmware in GitHub Actions whenever examples are present.

## License

License to be decided before the first public release.
