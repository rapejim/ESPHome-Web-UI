# Reusable frontend architecture proposal

[Versión en español](arquitectura.md)

## Purpose

Evolve the validated PoC into a reusable frontend library for ESPHome devices, keeping the firmware and UI independent from the specific board and entity names used by each installation.

This document records the architecture decisions for the next phase. It does not mean that every component will be implemented immediately.

## Constraints and decisions

1. **Standalone runtime:** all required assets are served by the ESP32 itself. No CDN, external fonts, frameworks or third-party runtime requests.
2. **Board independence:** the same frontend must work on classic ESP32, ESP32-C6 and other boards supported by ESPHome's web server.
3. **ESPHome as backend:** reuse `web_server` and its HTTP, REST and SSE interfaces; do not implement a parallel server.
4. **Local bundle:** ESPHome accepts one `js_include` file, served as `/0.js`. Source code may be organized into modules, but it will be bundled during development into one local file. No remote imports.
5. **Local styles:** keep custom CSS through `css_include`, without external stylesheets.
6. **Delegated authentication:** HTTP Digest authentication is configured in ESPHome. The frontend will not store credentials or implement its own authentication.
7. **Identifier compatibility:** use `name_id` and fall back to `id`, as in the validated PoC.

## Proposed layers

### 1. ESPHome transport

The only layer responsible for device communication:

- Subscribe to `/events` through `EventSource`.
- Parse `state`, `log` and `ping` events.
- Manage reconnection and heartbeat.
- Send REST commands using `fetch`.
- Expose callbacks/events independent from the UI.

It must not know about cards, controls, text or styling.

### 2. Entity registry and model

Keep the latest known entity state and normalize ESPHome identifiers.

Each entity should be identified by domain and ESPHome identifier, retaining its display name, state and available attributes. The registry notifies components about new entities and updates.

The first iteration will preserve the name-based identification used by the PoC; discovery and advanced configuration will be implemented incrementally.

### 3. Visual components

Independent components per entity type, sharing an update and lifecycle contract.

Initial order:

1. Sensor and binary sensor: read-only.
2. Switch and button: basic actions.
3. Light: on/off, brightness and color when supported by the entity type.
4. Fan and climate: later phases, after validating their models and endpoints.

Components must not open SSE connections or build HTTP requests directly; they use the client and registry.

### 4. Application and presentation

The application composes the header, connection status, entity groups, feedback and log viewer. Theme and responsive design remain in CSS and visual tokens, separate from transport logic.

The current PoC remains the reference demo during the transition.

## Configuration

An installation configuration should progressively declare:

- Device title and description.
- Visible entities and ordering.
- Custom labels and units.
- Groups/sections and visual options.

Not every device entity should be assumed visible. Automatic discovery may help, but final selection must be configurable.

## Target code structure

The exact structure will be chosen during implementation, but it must clearly separate:

- ESPHome client source.
- Entity registry/model.
- Components by domain.
- Application/demo.
- CSS and visual assets.
- Generated bundle consumed by `js_include`.

Generated files must be reproducible from source through a documented command. CI will verify that the bundle is up to date.

## Testing and quality

- Unit tests for the client, event normalization and entity registry.
- Syntax and bundle checks in CI.
- ESPHome validation and compilation for both examples.
- Physical ESP32-C6 Mini testing before considering features that depend on actual web server behavior stable.

## Security and known limits

- Always enable web server authentication and use a trusted network; the PoC does not provide HTTPS.
- Do not import third-party code or execute received content as HTML.
- Treat logs and states as untrusted text.
- Bound browser memory used by logs and histories.
- Account for the ESP32's limited memory when considering entity counts and simultaneous clients.

## Out of immediate scope

- Full support for every ESPHome domain.
- Visual dashboard editor.
- Home Assistant as a backend.
- Remote configuration or dashboard persistence on the device.
- First stable release and license selection.

## Next deliverable

The first implementation deliverable will extract SSE/REST transport from the PoC into an independent client, add automated tests and keep the demo UI working without visible changes. The entity registry and first generic components will follow.
