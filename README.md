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

El proyecto se encuentra en fase de prueba de concepto (PoC).

- Fase 1: estructura inicial del repositorio y CI con GitHub Actions.
- Fase 2: PoC para ESP32 mediante el servidor web integrado de ESPHome, JavaScript local y CSS local.
- Fase 3: ejemplo de configuración para ESP32-C6 Mini que reutiliza el mismo frontend.
- Próximas fases: componentes reutilizables, descubrimiento y configuración de entidades, sistema visual, pruebas con más placas y primeras versiones.

## Prueba de concepto

Actualmente hay dos configuraciones, ambas con el mismo frontend:

- ESP32 DevKit clásico: [examples/esp32-basic.yaml](examples/esp32-basic.yaml)
- ESP32-C6 Mini: [examples/esp32-c6-mini.yaml](examples/esp32-c6-mini.yaml)
- Instrucciones de configuración y flasheo: [examples/README.md](examples/README.md)
- Módulo JavaScript: [web/poc.js](web/poc.js)
- Hoja de estilos: [web/poc.css](web/poc.css)

La PoC muestra lecturas de temperatura y humedad en tiempo real, un interruptor y una luz RGB. Utiliza el flujo SSE `/events` de ESPHome para recibir estados y mensajes de log, y sus endpoints REST para enviar órdenes.

## Principios de desarrollo

- No se modifica `main` directamente: los cambios se proponen mediante pull requests.
- Los commits deben ser pequeños y centrados en un único propósito.
- Evitar dependencias en tiempo de ejecución y peticiones a servicios externos.
- Validar las configuraciones ESPHome y compilar los firmwares en GitHub Actions siempre que existan ejemplos.

## Idiomas de la documentación

El español es el idioma principal del proyecto. Los documentos en inglés se mantienen en archivos independientes con el sufijo `.en.md` y enlaces entre ambas versiones.

## Licencia

Pendiente de decidir antes de la primera versión pública.
