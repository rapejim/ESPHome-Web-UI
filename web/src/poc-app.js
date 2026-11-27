class ESPHomeWebUI extends HTMLElement {
  connectedCallback() {
    if (this.dataset.initialized === "true") return;
    this.dataset.initialized = "true";

    this.innerHTML = `
      <main class="shell">
        <header class="topbar">
          <div>
            <p class="eyebrow">ESPHOME · LOCAL CONTROL</p>
            <h1 id="device-title">Mi dispositivo</h1>
            <p id="device-subtitle" class="subtitle">Panel de control independiente</p>
          </div>
          <div id="connection-status" class="connection offline">
            <span class="connection-dot"></span>
            <span>Conectando…</span>
          </div>
        </header>

        <dashboard-editor></dashboard-editor>
        <div id="dashboard-sections"></div>
        <p id="feedback" class="feedback" role="status" aria-live="polite"></p>

        <section class="logs-section" aria-label="Registro del dispositivo">
          <details class="logs-panel">
            <summary><span>Registro del dispositivo</span><span id="log-count" class="log-count">0</span></summary>
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

    this._editor = this.querySelector("dashboard-editor");
    this._status = this.querySelector("#connection-status");
    this._feedback = this.querySelector("#feedback");
    this._logs = this.querySelector("#device-logs");
    this._logCount = this.querySelector("#log-count");
    this._logStatus = this.querySelector("#log-status");
    this._sensorCards = new Map();
    this._binarySensorCards = new Map();
    this._actuatorCards = new Map();
    this._groupContainers = new Map();
    this._dashboardConfig = DASHBOARD_CONFIG;
    this._deviceInfo = {};
    this._registry = new ESPHomeEntityRegistry();
    this._registry.subscribe(({ type, entity }) => {
      if (type === "added" || type === "updated") { this._renderEntity(entity); if (type === "added") this._renderEditor(); }
    });
    this._bindControls();
    this._connectClient();
  }

  _bindControls() {
    this.querySelector("#logs-clear").addEventListener("click", () => {
      this._logs.replaceChildren();
      this._logCount.textContent = "0";
      this._logStatus.textContent = "Registro limpiado";
    });
  }

  _connectClient() {
    this._client = new ESPHomeClient();
    this._client.on("connection", ({ connected, label }) => this._setConnection(connected, label));
    this._client.on("state", (data) => this._registry.update(data));
    this._client.on("deviceConfig", (config) => {
      this._deviceInfo = config;
      this._renderDeviceHeader();
    });
    this._client.on("log", (message) => this._appendLog(message));
    this._client.on("protocolError", () => this._showFeedback("No se ha podido interpretar una actualización."));
    this._loadDashboardConfig();
    this._client.connect();
  }

  async _loadDashboardConfig() {
    try {
      const response = await this._client.fetchImpl("/dashboard-config", {method:"GET",cache:"no-store"});
      if (response.status === 404) return;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const saved = await response.json();
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return;
      this._dashboardConfig = mergeDashboardConfig(DASHBOARD_CONFIG, saved);
      this._renderDeviceHeader();
      for (const entity of this._registry.getAll()) this._renderEntity(entity);
      this._renderEditor();
      for (const [id, group] of this._groupContainers) {
        if (group.grid.children.length === 0) {
          group.section.remove();
          this._groupContainers.delete(id);
        }
      }
    } catch (error) {
      // La ausencia de configuración persistida no impide cargar el dashboard predeterminado.
    }
  }

  _renderEditor() {
    if (!this._editor) return;
    this._editor.setData(this._dashboardConfig, this._registry.getAll(), (config) => this._saveDashboardConfig(config));
  }

  async _saveDashboardConfig(config) {
    const body = JSON.stringify(config);
    const bytes = new TextEncoder().encode(body).length;
    if (bytes > 768) throw new Error("La configuración supera el límite de 768 bytes.");
    const response = await this._client.fetchImpl("/dashboard-config", {
      method: "POST", headers: { "Content-Type": "application/json" }, body
    });
    if (response.status !== 202 && response.status !== 204) throw new Error("Error HTTP " + response.status);
    this._dashboardConfig = mergeDashboardConfig(DASHBOARD_CONFIG, config);
    this._renderDeviceHeader();
    for (const entity of this._registry.getAll()) this._renderEntity(entity);
    this._removeEmptyGroups();
    this._renderEditor();
    this._showFeedback(response.status === 202 ? "Configuración guardada." : "La configuración ya estaba guardada.");
  }

  _renderDeviceHeader() {
    const configuredName = this._dashboardConfig.deviceName.trim();
    const deviceName = configuredName || (typeof this._deviceInfo.title === "string" ? this._deviceInfo.title.trim() : "");
    this.querySelector("#device-title").textContent = deviceName || "Mi dispositivo";
    const subtitle = this._dashboardConfig.subtitle.trim() ||
      (typeof this._deviceInfo.comment === "string" ? this._deviceInfo.comment.trim() : "") ||
      "Panel de control independiente";
    this.querySelector("#device-subtitle").textContent = subtitle;
  }

  _appendLog(message) {
    const wasNearBottom = this._logs.scrollHeight - this._logs.scrollTop - this._logs.clientHeight < 48;
    const empty = this._logs.querySelector(".logs-empty");
    if (empty) empty.remove();
    const cleanMessage = String(message).replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");
    const line = document.createElement("div");
    line.className = "log-line";
    line.textContent = cleanMessage;
    const level = cleanMessage.match(/\[([EWIDV])\]/)?.[1] || "";
    if (level) line.dataset.level = level;
    this._logs.append(line);
    while (this._logs.children.length > 250) this._logs.firstElementChild.remove();
    this._logCount.textContent = String(this._logs.children.length);
    this._logStatus.textContent = "Recibiendo mensajes en tiempo real";
    if (wasNearBottom) this._logs.scrollTop = this._logs.scrollHeight;
  }

  _renderEntity(entity) {
    const presentation = getDashboardEntityConfig(entity, this._dashboardConfig);
    const existing = this._sensorCards.get(entity.id) || this._binarySensorCards.get(entity.id) || this._actuatorCards.get(entity.id);
    if (!presentation.visible) {
      existing?.remove();
      this._sensorCards.delete(entity.id);
      this._binarySensorCards.delete(entity.id);
      this._actuatorCards.delete(entity.id);
      return;
    }
    const displayEntity = {...entity,name:presentation.label||entity.name,description:presentation.description};
    const group = this._getGroupContainer(presentation.group);
    if (entity.domain === "sensor") {
      this._upsertDashboardCard(displayEntity,this._sensorCards,group.grid,createSensorCard,updateSensorCard,presentation.order);
    } else if (entity.domain === "binary_sensor") {
      this._upsertDashboardCard(displayEntity,this._binarySensorCards,group.grid,createBinarySensorCard,updateBinarySensorCard,presentation.order);
    } else if (["switch","button","light"].includes(entity.domain)) {
      const onCommand=(entityId,action,params)=>this._sendEntity(entityId,action,params);
      const cards=this._actuatorCards;
      let card=cards.get(entity.id);
      if(!card){
        if(entity.domain==="switch")card=createSwitchCard(displayEntity,onCommand);
        else if(entity.domain==="button")card=createButtonCard(displayEntity,onCommand);
        else if(entity.domain==="light")card=createLightCard(displayEntity,onCommand);
        if(!card)return;
        cards.set(entity.id,card);
        group.grid.append(card);
      }else{
        if(entity.domain==="switch")updateSwitchCard(card,displayEntity);
        else if(entity.domain==="button")updateButtonCard(card,displayEntity);
        else if(entity.domain==="light")updateLightCard(card,displayEntity);
        if(card.parentElement!==group.grid)group.grid.append(card);
      }
      card.dataset.order=String(presentation.order);
      this._sortGroupCards(group.grid);
    }
  }

  _removeEmptyGroups() {
    for (const [id, group] of this._groupContainers) {
      if (group.grid.children.length === 0) {
        group.section.remove();
        this._groupContainers.delete(id);
      }
    }
  }

  _getGroupContainer(groupConfig) {
    let container=this._groupContainers.get(groupConfig.id);
    if(container) {
      container.section.dataset.order=String(groupConfig.order);
      container.section.querySelector("h2").textContent=groupConfig.title;
      container.grid.className=groupConfig.layout==="sensors"?"sensor-grid":"actuators-grid";
      this._sortDashboardGroups();
      return container;
    }
    const section=document.createElement("section");
    section.className="section dashboard-group";
    section.dataset.groupId=groupConfig.id;
    section.dataset.order=String(groupConfig.order);
    const heading=document.createElement("div");
    heading.className="section-heading";
    const title=document.createElement("h2");
    title.textContent=groupConfig.title;
    heading.append(title);
    const grid=document.createElement("div");
    grid.className=groupConfig.layout==="sensors"?"sensor-grid":"actuators-grid";
    section.append(heading,grid);
    this.querySelector("#dashboard-sections").append(section);
    container={section,grid};
    this._groupContainers.set(groupConfig.id,container);
    this._sortDashboardGroups();
    return container;
  }

  _upsertDashboardCard(entity,cards,grid,createCard,updateCard,order) {
    let card=cards.get(entity.id);
    if(!card){card=createCard(entity);cards.set(entity.id,card);grid.append(card);}
    else{updateCard(card,entity);if(card.parentElement!==grid)grid.append(card);}
    card.dataset.order=String(order);
    this._sortGroupCards(grid);
  }

  _sortGroupCards(grid) {
    [...grid.children].sort((a,b)=>Number(a.dataset.order||0)-Number(b.dataset.order||0)).forEach((card)=>grid.append(card));
  }

  _sortDashboardGroups() {
    const root=this.querySelector("#dashboard-sections");
    [...root.children].sort((a,b)=>Number(a.dataset.order||0)-Number(b.dataset.order||0)).forEach((section)=>root.append(section));
  }

  async _sendEntity(entityId,action,params=new URLSearchParams()) {
    this._showFeedback("Enviando orden…");
    try{await this._client.command(entityId,action,params);this._showFeedback("Orden enviada correctamente.");}
    catch(error){this._showFeedback(`No se ha podido enviar la orden: ${error.message}`);}
  }

  _setConnection(connected,label) {
    this._status.classList.toggle("online",connected);
    this._status.classList.toggle("offline",!connected);
    this._status.lastElementChild.textContent=label;
  }

  _showFeedback(message) {
    this._feedback.textContent=message;
    this._feedback.dataset.updatedAt=String(Date.now());
  }
}

if(typeof customElements!=="undefined"&&!customElements.get("esp-app"))customElements.define("esp-app",ESPHomeWebUI);
