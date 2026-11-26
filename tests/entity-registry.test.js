"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { ESPHomeEntityRegistry } = require("../web/src/entity-registry.js");

test("normalizes name_id and falls back to id", () => {
  const byName = ESPHomeEntityRegistry.normalize({ name_id: "sensor/Room temperature", state: "21.5" });
  const byId = ESPHomeEntityRegistry.normalize({ id: "binary_sensor/window", state: "ON" });
  assert.equal(byName.domain, "sensor");
  assert.equal(byName.objectId, "Room temperature");
  assert.equal(byId.id, "binary_sensor/window");
  assert.equal(byId.state, "ON");
});

test("rejects malformed or missing entity identifiers", () => {
  assert.equal(ESPHomeEntityRegistry.normalize(null), null);
  assert.equal(ESPHomeEntityRegistry.normalize({ state: "ON" }), null);
  assert.equal(ESPHomeEntityRegistry.normalize({ id: "/empty-domain" }), null);
  assert.equal(ESPHomeEntityRegistry.normalize({ id: "sensor/" }), null);
});

test("adds an entity and notifies subscribers", () => {
  const registry = new ESPHomeEntityRegistry();
  const changes = [];
  registry.subscribe((change) => changes.push(change));
  const entity = registry.update({ id: "sensor/temperature", state: "20.1", unit_of_measurement: "°C" });
  assert.equal(entity.domain, "sensor");
  assert.equal(registry.get("sensor/temperature").state, "20.1");
  assert.equal(changes[0].type, "added");
});

test("updates existing entity while preserving previously received attributes", () => {
  const registry = new ESPHomeEntityRegistry();
  registry.update({ id: "sensor/temperature", state: "20.1", unit_of_measurement: "°C" });
  const change = registry.update({ id: "sensor/temperature", state: "20.8" });
  assert.equal(change.type, undefined);
  assert.equal(change.state, "20.8");
  assert.equal(change.attributes.unit_of_measurement, "°C");
  assert.equal(registry.getAll().length, 1);
});

test("filters entities by domain", () => {
  const registry = new ESPHomeEntityRegistry();
  registry.update({ id: "sensor/temperature", state: "20" });
  registry.update({ id: "binary_sensor/window", state: "OFF" });
  assert.equal(registry.getByDomain("sensor").length, 1);
  assert.equal(registry.getByDomain("binary_sensor")[0].objectId, "window");
});

test("supports unsubscribe and clear", () => {
  const registry = new ESPHomeEntityRegistry();
  let count = 0;
  const unsubscribe = registry.subscribe(() => count++);
  registry.update({ id: "sensor/a", state: "1" });
  unsubscribe();
  registry.clear();
  assert.equal(count, 1);
  assert.equal(registry.getAll().length, 0);
});
