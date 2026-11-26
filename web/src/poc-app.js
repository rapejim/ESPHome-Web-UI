const ENTITY_IDS = {
  switch: "switch/Interruptor demo",
  light: "light/Luz RGB demo",
};

class ESPHomeWebUI extends HTMLElement {
  connectedCallback() {
    if (this.dataset.initialized === "true") return;
    this.dataset.initialized = "true";

    this.innerHTML = `
      <main class="shell">
        <header class="topbar">
          <div>
            <p class="eyebrow">ESPHOME · LOCAL CONTROL</p>
            <h1>Mi dispositivo</h1>
            <p class="subtitle">Panel de control independiente</p>
          </div>
          <div id="connection-status" class="connection offline">
            <span class="connection-dot"></span>
            <span>Conectando…</span>
          </div>
        </header>

        <section class="section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">LECTURAS</p>
              <h2>Estado ambiental</h2>
            </div>
            <span class="section-note">Actualización en tiempo real</span>
          </div>
          <div id="sensor-grid" class="sensor-grid"></div>
        </section>

        <section id="binary-sensors-section" class="section" hidden>
          <div class="section-heading"><div><p class="eyebrow">ESTADOS</p><h2>Sensores binarios</h2></div></div>
          <div id="binary-sensor-grid" class="sensor-grid"></div>
        </section>

        <section class="section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">ACTUADORES</p>
              <h2>Controles</h2>
            </div>
          </div>
          <article class="card control-card">
            <div class="control-copy">
              <div class="control-icon">◉</div>
              <div>
                <h3>Interruptor demo</h3>
                <p id="switch-state" class="muted">Esperando estado…</p>
              </div>
            </div>
            <button id="switch-action" class="button secondary" type="button" disabled>
              Cargando…
            </button>
          </article>

          <article class="card light-card">
            <div class="light-heading">
              <div>
                <h3>Luz RGB demo</h3>
                <p id="light-state" class="muted">Esperando estado…</p>
              </div>
              <span id="light-preview" class="light-preview"></span>
            </div>
            <div class="light-controls">
              <label class="color-control">
                <span>Color</span>
                <input id="light-color" type="color" value="#ffffff" aria-label="Elegir color de la luz">
              </label>
              <button id="light-apply" class="button primary" type="button">Aplicar color</button>
              <button id="light-off" class="button secondary" type="button">Apagar</button>
            </div>
          </article>
        </section>

        <p id="feedback" class="feedback" role="status" aria-live="polite"></p>

        <section class="logs-section" aria-label="Registro del dispositivo">
          <details class="logs-panel">
            <summary>
              <span>Registro del dispositivo</span>
              <span id="log-count" class="log-count">0</span>
            </summary>
            <div class="logs-toolbar">
              <span id="log-status" class="logs-status">Esperando mensajes…</span>
              <button id="logs-clear" class="button secondary" type="button">Limpiar</button>
            </div>
            <div id="device-logs" class="device-logs" role="log" aria-live="off" aria-relevant="additions">
              <p class="logs-empty">Los mensajes del dispositivo aparecerán aquí.</p>
            </div>
          </details>
        </section>

        <footer>ESPHome Web UI · <span id="app-version">v__APP_VERSION__</span> · Sin servicios externos</footer>
      </main>
    `;

    this._status = this.querySelector("#connection-status");
    this._feedback = this.querySelector("#feedback");
    this._logs = this.querySelector("#device-logs");
    this._logCount = this.querySelector("#log-count");
    this._logStatus = this.querySelector("#log-status");
    this._sensorCards = new Map();
    this._binarySensorCards = new Map();
    this._registry = new ESPHomeEntityRegistry();
    this._registry.subscribe(({ type, entity }) => {
      if (type === "added" || type === "updated") this._renderEntity(entity);
    });
    this._bindControls();
    this._connectClient();
  }

  _bindControls() {
    this.querySelector("#switch-action").addEventListener("click", async () => {
      const button = this.querySelector("#switch-action");
      const isOn = button.dataset.state === "on";
      await this._sendEntity(
        ENTITY_IDS.switch,
        isOn ? "turn_off" : "turn_on",
      );
    });

    this.querySelector("#light-apply").addEventListener("click", async () => {
      const hex = this.querySelector("#light-color").value;
      const red = Number.parseInt(hex.slice(1, 3), 16);
      const green = Number.parseInt(hex.slice(3, 5), 16);
      const blue = Number.parseInt(hex.slice(5, 7), 16);
      const params = new URLSearchParams({
        r: String(red),
        g: String(green),
        b: String(blue),
        brightness: "255",
        transition: "0.3",
      });
      await this._sendEntity(ENTITY_IDS.light, "turn_on", params);
    });

    this.querySelector("#light-off").addEventListener("click", async () => {
      await this._sendEntity(ENTITY_IDS.light, "turn_off");
    });

    this.querySelector("#logs-clear").addEventListener("click", () => {
      this._logs.replaceChildren();
      this._logCount.textContent = "0";
      this._logStatus.textContent = "Registro limpiado";
    });
  }

  _connectClient() {
    this._client = new ESPHomeClient();
    this._client.on("connection", ({ connected, label }) => {
      this._setConnection(connected, label);
    });
    this._client.on("state", (data) => this._registry.update(data));
    this._client.on("log", (message) => this._appendLog(message));
    this._client.on("protocolError", () => {
      this._showFeedback("No se ha podido interpretar una actualización.");
    });
    this._client.connect();
  }

  _appendLog(message) {
    const wasNearBottom =
      this._logs.scrollHeight - this._logs.scrollTop - this._logs.clientHeight < 48;
    const empty = this._logs.querySelector(".logs-empty");
    if (empty) empty.remove();

    // Log messages may contain ANSI color sequences. Render as text, never HTML.
    const cleanMessage = String(message).replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");
    const line = document.createElement("div");
    line.className = "log-line";
    line.textContent = cleanMessage;

    const level = cleanMessage.match(/\[([EWIDV])\]/)?.[1] || "";
    if (level) line.dataset.level = level;
    this._logs.append(line);

    // Keep browser memory bounded on devices that emit frequent debug messages.
    while (this._logs.children.length > 250) {
      this._logs.firstElementChild.remove();
    }

    this._logCount.textContent = String(this._logs.children.length);
    this._logStatus.textContent = "Recibiendo mensajes en tiempo real";
    if (wasNearBottom) this._logs.scrollTop = this._logs.scrollHeight;
  }

  _renderEntity(entity) {
    if (entity.domain === "sensor") { this._upsertDomainCard(entity, "sensor"); return; }
    if (entity.domain === "binary_sensor") { this._upsertDomainCard(entity, "binary_sensor"); return; }

    if (entity.id === ENTITY_IDS.switch) {
      const isOn = entity.state === true || entity.state === "ON";
      const button = this.querySelector("#switch-action");
      button.disabled = false;
      button.dataset.state = isOn ? "on" : "off";
      button.textContent = isOn ? "Apagar" : "Encender";
      this.querySelector("#switch-state").textContent = isOn ? "Encendido" : "Apagado";
      return;
    }

    if (entity.id === ENTITY_IDS.light) {
      const isOn = entity.state === "ON";
      this.querySelector("#light-state").textContent = isOn ? "Encendida" : "Apagada";
      const color = entity.attributes.color;
      if (color) {
        const toHex = (value) => Math.round(value).toString(16).padStart(2, "0");
        const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
        this.querySelector("#light-color").value = hex;
        this.querySelector("#light-preview").style.backgroundColor = hex;
      }
    }
  }

  _upsertDomainCard(entity, domain) {
    const binary = domain === "binary_sensor";
    const cards = binary ? this._binarySensorCards : this._sensorCards;
    const grid = this.querySelector(binary ? "#binary-sensor-grid" : "#sensor-grid");
    const section = binary ? this.querySelector("#binary-sensors-section") : grid.closest(".section");
    let card = cards.get(entity.id);
    if (!card) {
      card = binary ? createBinarySensorCard(entity) : createSensorCard(entity);
      cards.set(entity.id, card);
      grid.append(card);
    } else if (binary) updateBinarySensorCard(card, entity);
    else updateSensorCard(card, entity);
    section.hidden = false;
  }
  async _sendEntity(entityId, action, params = new URLSearchParams()) {
    this._showFeedback("Enviando orden…");
    try {
      await this._client.command(entityId, action, params);
      this._showFeedback("Orden enviada correctamente.");
    } catch (error) {
      this._showFeedback(`No se ha podido enviar la orden: ${error.message}`);
    }
  }

  _setConnection(connected, label = connected ? "Conectado" : "Desconectado") {
    this._status.classList.toggle("online", connected);
    this._status.classList.toggle("offline", !connected);
    this._status.lastElementChild.textContent = label;
  }

  _showFeedback(message) {
    this._feedback.textContent = message;
  }
}

if (!customElements.get("esp-app")) {
  customElements.define("esp-app", ESPHomeWebUI);
}
