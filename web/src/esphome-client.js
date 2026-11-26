(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ESPHomeClient = api.ESPHomeClient;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  class ESPHomeClient {
    constructor(options = {}) {
      this.EventSourceClass = options.EventSourceClass || globalThis.EventSource;
      this.fetchImpl = options.fetchImpl || globalThis.fetch;
      this.now = options.now || Date.now;
      this.setIntervalFn = options.setIntervalFn || globalThis.setInterval;
      this.clearIntervalFn = options.clearIntervalFn || globalThis.clearInterval;
      this.heartbeatTimeout = options.heartbeatTimeout ?? 25000;
      this.heartbeatInterval = options.heartbeatInterval ?? 5000;
      this.listeners = new Map();
      this.events = null;
      this.heartbeatTimer = null;
      this.lastPingAt = 0;
      this.connection = { connected: false, label: "Conectando…" };
    }

    on(type, callback) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(callback);
      return () => this.off(type, callback);
    }

    off(type, callback) {
      this.listeners.get(type)?.delete(callback);
    }

    _emit(type, detail) {
      for (const callback of this.listeners.get(type) || []) callback(detail);
    }

    connect() {
      if (this.events || !this.EventSourceClass) return;
      this.events = new this.EventSourceClass("/events");
      this.lastPingAt = this.now();

      this.heartbeatTimer = this.setIntervalFn(() => {
        if (this.now() - this.lastPingAt > this.heartbeatTimeout) {
          this._setConnection(false, "Sin comunicación");
        }
      }, this.heartbeatInterval);

      this.events.addEventListener("open", () => {
        this.lastPingAt = this.now();
        this._setConnection(true, "Conectado");
      });

      this.events.addEventListener("state", (event) => {
        try {
          this._emit("state", JSON.parse(event.data));
        } catch (error) {
          this._emit("protocolError", error);
        }
      });

      this.events.addEventListener("log", (event) => this._emit("log", event.data));

      this.events.addEventListener("ping", () => {
        this.lastPingAt = this.now();
        this._setConnection(true, "Conectado");
      });

      this.events.addEventListener("error", () => {
        this._setConnection(false, "Reconectando…");
      });
    }

    async command(entityId, action, params = new URLSearchParams()) {
      if (!this.fetchImpl) throw new Error("Fetch API no disponible");
      const path = entityId
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      const query = params.toString();
      const url = `/${path}/${action}${query ? `?${query}` : ""}`;
      const response = await this.fetchImpl(url, { method: "POST" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    }

    close() {
      if (this.heartbeatTimer !== null) {
        this.clearIntervalFn(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      if (this.events) {
        this.events.close();
        this.events = null;
      }
      this._setConnection(false, "Desconectado");
    }

    _setConnection(connected, label) {
      if (
        this.connection.connected === connected &&
        this.connection.label === label
      ) return;
      this.connection = { connected, label };
      this._emit("connection", this.connection);
    }
  }

  return { ESPHomeClient };
});
