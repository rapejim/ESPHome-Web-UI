# ESPHome Web UI

Interfaz web reutilizable y autoalojada para dispositivos ESPHome.

El objetivo del proyecto es sustituir la interfaz web nativa de ESPHome por una interfaz propia, adaptable a móviles, tabletas y ordenadores, servida directamente desde el ESP32. Los recursos necesarios para ejecutarla se alojan en el propio dispositivo: no necesita CDN, fuentes externas, frameworks JavaScript ni conexión a Internet.

[English version](README.en.md)

## Objetivos

- Dar soporte a entidades habituales de ESPHome: sensores, interruptores, luces, ventiladores, climatización y más.
- Adaptarse a móviles, tabletas y ordenadores.
- Mantener la interfaz independiente del hardware y de la configuración de entidades.
- Utilizar HTML, CSS y JavaScript nativos con un consumo reducido de recursos.
- Reutilizar las API HTTP, REST y Server-Sent Events de ESPHome siempre que sea posible.

## Estado del proyecto

La prueba de concepto está validada en hardware ESP32-C6 Mini. Se han comprobado las lecturas, los controles, el visor de logs y la detección/recuperación de desconexiones.

- Fase 1: estructura inicial del repositorio y CI.
- Fase 2: PoC para ESP32 mediante el servidor web integrado de ESPHome, JavaScript local y CSS local.
- Fase 3: ejemplo ESP32-C6 Mini y validación funcional en hardware.
- Fase 4: arquitectura del frontend reutilizable y cliente SSE/REST independiente.
- Fase 5: registro normalizado de entidades.
- Fase 6: componentes genéricos para sensores y sensores binarios, con versión visible en la interfaz.
- Fase 7 (en curso): componentes genéricos para `switch`, `button` y `light`.
- Próximas fases: configuración de dashboards, grupos, etiquetas y pruebas con más placas.

Consulta la [arquitectura propuesta](docs/arquitectura.md) para conocer las capas, decisiones y alcance de la siguiente implementación.

## Prueba de concepto

Actualmente hay dos configuraciones, ambas con el mismo frontend:

- ESP32 DevKit clásico: [examples/esp32-basic.yaml](examples/esp32-basic.yaml)
- ESP32-C6 Mini: [examples/esp32-c6-mini.yaml](examples/esp32-c6-mini.yaml)
- Instrucciones de configuración y flasheo: [examples/README.md](examples/README.md)
- Módulo JavaScript: [web/poc.js](web/poc.js)
- Hoja de estilos: [web/poc.css](web/poc.css)

La interfaz muestra automáticamente las entidades `sensor`, `binary_sensor`, `switch`, `button` y `light` recibidas desde ESPHome. Utiliza el flujo SSE `/events` de ESPHome para recibir estados y mensajes de log, y sus endpoints REST para enviar órdenes.

## Versionado

La versión se mantiene en `package.json` siguiendo Semantic Versioning y el build la inserta automáticamente en el pie de página.

## Principios de desarrollo

- No se modifica `main` directamente: los cambios se proponen mediante pull requests.
- Los commits deben ser pequeños y centrados en un único propósito; se agrupan antes de subirlos a GitHub.
- Evitar dependencias en tiempo de ejecución y peticiones a servicios externos.
- Validar las configuraciones ESPHome y compilar los firmwares en GitHub Actions siempre que existan ejemplos.
- Las comprobaciones automáticas se ejecutan en PRs; `workflow_dispatch` permite lanzarlas manualmente.

## Idiomas de la documentación

El español es el idioma principal del proyecto. Los documentos en inglés se mantienen en archivos independientes con el sufijo `.en.md` y enlaces entre ambas versiones.

## Licencia

Pendiente de decidir antes de la primera versión pública.
