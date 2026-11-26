# Prueba de concepto para ESP32

La PoC incluye dos configuraciones de placa que comparten el mismo frontend local (`web/poc.js` y `web/poc.css`). Ambos ejemplos utilizan sensores virtuales, un interruptor virtual y una luz RGB virtual, por lo que no necesitan periféricos externos.

[English version](README.en.md)

## Ejemplos disponibles

| Archivo | Placa objetivo | Framework |
| --- | --- | --- |
| `esp32-basic.yaml` | ESP32 DevKit (ESP32 clásico) | Arduino |
| `esp32-c6-mini.yaml` | ESP32-C6 Super Mini (definición de placa ESP32-C6 DevKitC-1) | ESP-IDF |

**Nota sobre ESP32-C6:** el ejemplo está preparado para la variante habitual ESP32-C6 Super Mini y utiliza `esp32-c6-devkitc-1` como definición de placa de ESPHome/PlatformIO, junto con ESP-IDF. Si tu placa es otra variante C6 Mini, comprueba el modelo exacto antes de flashear.

## Antes de compilar o flashear

Edita el YAML del ejemplo que vayas a utilizar:

1. Sustituye `REPLACE_WITH_WIFI_SSID` y `REPLACE_WITH_WIFI_PASSWORD` por las credenciales de tu Wi-Fi.
2. Cambia el usuario y la contraseña de la interfaz web. Los valores incluidos en el repositorio son solo marcadores de ejemplo y no deben utilizarse en una red real.
3. Mantén el dispositivo en una red local de confianza. Esta PoC utiliza autenticación HTTP Digest, pero no proporciona HTTPS.

## Compilar con ESPHome

Ejecuta los comandos correspondientes desde la raíz del repositorio.

ESP32 clásico:

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

Conecta la placa por USB para el primer flasheo. Cuando se conecte a la Wi-Fi, abre su dirección IP en el navegador; se solicitarán las credenciales del servidor web.

## Qué comprobar

- La temperatura y la humedad se actualizan cada cinco segundos.
- El interruptor se puede encender y apagar.
- El selector de color envía los valores rojo, verde y azul a la luz.
- Los cambios de estado y los mensajes de log llegan mediante Server-Sent Events a través de `/events`. La configuración guardada del dashboard se sirve desde `/dashboard-config` y persiste en las preferencias del ESP32.
- Todos los recursos de la interfaz se sirven desde el ESP32. El navegador no necesita CDN ni acceso a Internet.

## Notas de implementación

El servidor web versión 2 de ESPHome genera una estructura HTML mínima que contiene un elemento `<esp-app>`. Con `js_url: ""` y `js_include`, el dispositivo sirve nuestro módulo en `/0.js`; el módulo define el elemento personalizado `esp-app` y genera toda la interfaz. `css_include` sirve la hoja de estilos en `/0.css`.

Los ejemplos no configuran `local: true`: esa opción incorpora el frontend incluido en ESPHome, mientras que esta PoC utiliza la estructura HTML configurable y las rutas locales para los recursos. Los valores vacíos de `js_url` y `css_url` evitan solicitudes a recursos externos.

La PoC reutiliza las API existentes de ESPHome:

- `GET /events`: estados iniciales, actualizaciones en tiempo real y mensajes de log.
- `POST /switch/{entity}/turn_on` y `turn_off`: control del interruptor.
- `POST /light/{entity}/turn_on?r=...&g=...&b=...`: control de la luz RGB.

El frontend utiliza `name_id` cuando está disponible y recurre a `id` como alternativa, para mantener compatibilidad con el cambio de identificadores de entidades de ESPHome.
