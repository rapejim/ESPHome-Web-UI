# Arquitectura propuesta del frontend reutilizable

[English version](architecture.en.md)

## Propósito

Evolucionar la PoC validada hacia una biblioteca frontend reutilizable para distintos dispositivos ESPHome, manteniendo el firmware y la interfaz desacoplados de la placa concreta y de los nombres de las entidades de cada instalación.

Este documento fija las decisiones de arquitectura para la siguiente fase. No implica todavía implementar todos los componentes.

## Restricciones y decisiones

1. **Runtime autónomo:** los recursos necesarios se sirven desde el propio ESP32. No se permiten CDN, fuentes externas, frameworks ni peticiones a servicios de terceros en tiempo de ejecución.
2. **Sin lógica específica de placa:** el mismo frontend debe funcionar en ESP32 clásico, ESP32-C6 y otras placas compatibles con el servidor web de ESPHome.
3. **ESPHome como backend:** reutilizar `web_server` y sus interfaces HTTP, REST y SSE; no implementar un servidor paralelo.
4. **Bundle local:** ESPHome permite configurar un único `js_include`, servido como `/0.js`. El código fuente podrá organizarse en módulos, pero se empaquetará durante el desarrollo en un único archivo local. No se dependerá de imports remotos.
5. **Estilos locales:** mantener CSS propio mediante `css_include`, sin hojas externas.
6. **Autenticación delegada:** la autenticación HTTP Digest se configura en ESPHome. El frontend no almacenará credenciales ni intentará implementar autenticación propia.
7. **Compatibilidad de identificadores:** utilizar `name_id` y recurrir a `id` como fallback, como hace la PoC validada.

## Capas propuestas

### 1. Transporte ESPHome

Responsabilidad única de comunicarse con el dispositivo:

- Suscribirse a `/events` mediante `EventSource`.
- Interpretar eventos `state`, `log` y `ping`.
- Gestionar reconexión y heartbeat.
- Enviar órdenes REST con `fetch`.
- Exponer callbacks/eventos independientes de la interfaz.

No debe conocer tarjetas, controles, textos ni estilos.

### 2. Registro y modelo de entidades

Mantener el último estado conocido de las entidades y normalizar sus identificadores.

Cada entidad debe poder identificarse por dominio e identificador ESPHome, conservando nombre visible, estado y atributos disponibles. El registro notificará altas/actualizaciones a la capa de componentes.

La primera iteración mantendrá compatibilidad con la identificación por nombre usada por la PoC; el descubrimiento y la configuración avanzada se implementarán de forma incremental.

### 3. Componentes visuales

Componentes independientes por tipo de entidad, con una interfaz común de actualización y ciclo de vida.

Orden inicial propuesto:

1. Sensor y binary sensor: solo lectura.
2. Switch y button: acciones básicas.
3. Light: encendido/apagado, brillo y color cuando el estado expuesto por ESPHome confirma que esas capacidades están disponibles.
4. Fan y climate: en fases posteriores, tras validar sus modelos y endpoints.

Los componentes no deben abrir conexiones SSE ni construir peticiones HTTP directamente; utilizarán el cliente y el registro.

### 4. Aplicación y presentación

La aplicación compone la cabecera, estado de conexión, grupos de entidades, feedback y visor de logs. El tema y el diseño responsive se mantienen en CSS y tokens visuales, separados de la lógica de transporte.

La PoC actual seguirá siendo el ejemplo de referencia durante la transición.

## Configuración

La configuración de una instalación debe poder declarar, progresivamente:

- Título y descripción del dispositivo.
- Entidades que se muestran y orden.
- Etiquetas y descripciones complementarias.
- Grupos/secciones y opciones visuales.

No se debe asumir que todas las entidades del dispositivo tienen que mostrarse. El descubrimiento automático podrá ayudar, pero la selección final debe ser configurable.

## Estructura de código objetivo

La estructura exacta se decidirá al implementar, pero debe separar claramente:

- Código fuente del cliente ESPHome.
- Registro/modelo de entidades.
- Componentes por dominio.
- Aplicación/demo.
- CSS y recursos visuales.
- Bundle generado que consume `js_include`.

Los archivos generados deben poder reproducirse desde el código fuente mediante un comando documentado. CI comprobará que el bundle está actualizado.

## Pruebas y calidad

- Pruebas unitarias del cliente, normalización de eventos y registro de entidades.
- Comprobación de sintaxis y bundle en CI.
- Validación y compilación de ambos ejemplos ESPHome.
- Pruebas físicas en ESP32-C6 Mini antes de considerar estable una funcionalidad que dependa del comportamiento real del servidor web.

## Seguridad y límites conocidos

- Usar siempre autenticación en el servidor web y una red de confianza; la PoC no proporciona HTTPS.
- No importar código de terceros ni ejecutar contenido recibido como HTML.
- Tratar logs y estados como texto no confiable.
- Limitar memoria usada por logs e historiales en el navegador.
- El número de entidades y clientes simultáneos debe tenerse en cuenta por la memoria limitada del ESP32.

## Fuera del alcance inmediato

- Soporte completo de todos los dominios ESPHome.
- Editor visual de dashboards.
- Integración con Home Assistant como backend.
- Configuración remota o persistencia de dashboards en el dispositivo.
- Publicación de una primera versión estable y elección de licencia.

## Configuración de dashboards

La configuración declarativa vive en `web/src/dashboard-config.js` y se empaqueta en el bundle local. Cada entidad puede configurarse por su identificador normalizado (`name_id`, con fallback a `id`) con `visible`, `label`, `description`, `group` y `order`. Los grupos declaran título, dominios, tipo de cuadrícula y orden. `showUnconfiguredEntities: false` activa el modo de selección explícita. La cabecera obtiene el nombre real desde `title` en el primer evento SSE `ping`, que ESPHome rellena con `friendly_name` o `name`; `deviceName` permite una etiqueta fija.

## Siguiente entrega

Validar esta configuración en ESP32-C6 Mini y, a continuación, estudiar edición visual/persistencia de dashboards sin añadir almacenamiento pesado al dispositivo.
