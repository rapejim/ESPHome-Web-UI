(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ESPHomeEntityRegistry = api.ESPHomeEntityRegistry;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  class ESPHomeEntityRegistry {
    constructor() {
      this.entities = new Map();
      this.listeners = new Set();
    }

    static normalize(payload) {
      if (!payload || typeof payload !== "object") return null;
      const entityId = payload.name_id || payload.id;
      if (typeof entityId !== "string" || !entityId.includes("/")) return null;
      const separator = entityId.indexOf("/");
      const domain = entityId.slice(0, separator);
      const objectId = entityId.slice(separator + 1);
      if (!domain || !objectId) return null;
      return {
        id: entityId,
        domain,
        objectId,
        name: payload.name || objectId,
        state: payload.state ?? payload.value ?? null,
        attributes: payload,
        updatedAt: Date.now(),
      };
    }

    update(payload) {
      const entity = ESPHomeEntityRegistry.normalize(payload);
      if (!entity) return null;
      const previous = this.entities.get(entity.id);
      const next = {
        ...previous,
        ...entity,
        attributes: { ...(previous?.attributes || {}), ...entity.attributes },
      };
      this.entities.set(next.id, next);
      this._emit({ type: previous ? "updated" : "added", entity: next, previous: previous || null });
      return next;
    }

    get(id) {
      return this.entities.get(id) || null;
    }

    getAll() {
      return [...this.entities.values()];
    }

    getByDomain(domain) {
      return this.getAll().filter((entity) => entity.domain === domain);
    }

    subscribe(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }

    _emit(change) {
      for (const callback of this.listeners) callback(change);
    }

    clear() {
      this.entities.clear();
      this._emit({ type: "cleared", entity: null, previous: null });
    }
  }

  return { ESPHomeEntityRegistry };
});
