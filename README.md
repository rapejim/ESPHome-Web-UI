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
- Later phases: reusable UI components, entity discovery/configuration, visual design system, broader board testing and releases.

## Proof of concept

The first example targets a generic ESP32 DevKit board:

- Example configuration: [examples/esp32-basic.yaml](examples/esp32-basic.yaml)
- Setup and flashing instructions: [examples/README.md](examples/README.md)
- Frontend module: [web/poc.js](web/poc.js)
- Stylesheet: [web/poc.css](web/poc.css)

The PoC demonstrates live temperature and humidity readings, a switch, and an RGB light. It uses ESPHome's `/events` Server-Sent Events endpoint for state updates and its REST endpoints for control.

## Development principles

- No changes directly to `main`; work is submitted through pull requests.
- Keep commits small and focused.
- Avoid runtime dependencies and external network requests.
- Validate ESPHome examples and compile firmware in GitHub Actions whenever examples are present.

## License

License to be decided before the first public release.
