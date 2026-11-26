# ESPHome Web UI

A reusable, self-hosted web interface for ESPHome devices.

The project aims to replace the native ESPHome web interface with a custom responsive UI for phones, tablets and desktops, served directly from the ESP32. Runtime assets are hosted on the device itself: no CDN, external fonts, JavaScript frameworks or internet connection are required.

[Versión en español](README.md)

## Goals

- Support common ESPHome entities: sensors, switches, lights, fans, climate and more.
- Adapt to phones, tablets and desktops.
- Keep the UI independent from hardware and entity configuration.
- Use native HTML, CSS and JavaScript with a small runtime footprint.
- Reuse ESPHome's HTTP, REST and Server-Sent Events APIs whenever practical.

## Project status

The project is in its proof-of-concept (PoC) stage.

- Phase 1: repository scaffolding and GitHub Actions CI.
- Phase 2: ESP32 PoC using ESPHome's built-in web server, local JavaScript and local CSS.
- Phase 3: ESP32-C6 Mini configuration example reusing the same frontend.
- Upcoming phases: reusable components, entity discovery/configuration, visual design system, broader board testing and initial releases.

## Proof of concept

Two board configurations are currently available, both sharing the same frontend:

- Classic ESP32 DevKit: [examples/esp32-basic.yaml](examples/esp32-basic.yaml)
- ESP32-C6 Mini: [examples/esp32-c6-mini.yaml](examples/esp32-c6-mini.yaml)
- Setup and flashing instructions: [examples/README.en.md](examples/README.en.md)
- JavaScript module: [web/poc.js](web/poc.js)
- Stylesheet: [web/poc.css](web/poc.css)

The PoC displays live temperature and humidity readings, a switch and an RGB light. It uses ESPHome's `/events` SSE stream for state updates and log messages, and its REST endpoints to send commands.

## Development principles

- Do not modify `main` directly; submit changes through pull requests.
- Keep commits small and focused.
- Avoid runtime dependencies and external network requests.
- Validate ESPHome configurations and compile firmware in GitHub Actions whenever examples are present.

## Documentation languages

Spanish is the project's primary language. English documents are maintained in separate files using the `.en.md` suffix, with links between both versions.

## License

To be decided before the first public release.
