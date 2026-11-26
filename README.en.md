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

The proof of concept has been validated on ESP32-C6 Mini hardware. Readings, controls, the log viewer and disconnect/recovery behavior have been tested.

- Phase 1: repository scaffolding and CI.
- Phase 2: ESP32 PoC using ESPHome's built-in web server, local JavaScript and local CSS.
- Phase 3: ESP32-C6 Mini example and functional hardware validation.
- Phase 4: reusable frontend architecture and independent SSE/REST client.
- Phase 5: normalized entity registry.
- Phase 6: generic sensor and binary sensor components, with a visible UI version.
- Phase 7 (in progress): generic `switch`, `button` and `light` components.
- Upcoming phases: dashboard configuration, groups, labels and broader board testing.

See the [proposed architecture](docs/architecture.en.md) for the next implementation's layers, decisions and scope.

## Proof of concept

Two board configurations are currently available, both sharing the same frontend:

- Classic ESP32 DevKit: [examples/esp32-basic.yaml](examples/esp32-basic.yaml)
- ESP32-C6 Mini: [examples/esp32-c6-mini.yaml](examples/esp32-c6-mini.yaml)
- Setup and flashing instructions: [examples/README.en.md](examples/README.en.md)
- JavaScript module: [web/poc.js](web/poc.js)
- Stylesheet: [web/poc.css](web/poc.css)

The UI automatically displays `sensor`, `binary_sensor`, `switch`, `button` and `light` entities received from ESPHome. It uses ESPHome's `/events` SSE stream for state updates and log messages, and its REST endpoints to send commands.

## Dashboard configuration

The initial configuration lives in `web/src/dashboard-config.js` and is bundled into `web/poc.js`. It supports device name and subtitle, groups, group order, entity visibility, labels, units, group assignment and per-entity order. To show only an explicit selection, set `showUnconfiguredEntities: false` and mark each desired entity with `visible: true`. Entity keys must match `name_id` (falling back to `id`). The device name is read from ESPHome's initial SSE config event; `deviceName` can override it.

## Versioning

The version is maintained in `package.json` using Semantic Versioning and injected into the UI footer by the build process.

## Development principles

- Do not modify `main` directly; submit changes through pull requests.
- Keep commits small and focused, then batch them before pushing to GitHub.
- Avoid runtime dependencies and external network requests.
- Validate ESPHome configurations and compile firmware in GitHub Actions whenever examples are present.
- Automated checks run on PRs; `workflow_dispatch` is available for manual runs.

## Documentation languages

Spanish is the project's primary language. English documents are maintained in separate files using the `.en.md` suffix, with links between both versions.

## License

To be decided before the first public release.
