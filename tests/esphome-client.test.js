"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { ESPHomeClient } = require("../web/src/esphome-client.js");

class FakeEventSource {
  constructor(url) {
    this.url = url;
    this.listeners = new Map();
    this.closed = false;
    FakeEventSource.latest = this;
  }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  emit(type, data = "") {
    for (const callback of this.listeners.get(type) || []) callback({ data });
  }
  close() { this.closed = true; }
}

function makeClient(overrides = {}) {
  let now = 1000;
  let tick;
  const client = new ESPHomeClient({
    EventSourceClass: FakeEventSource,
    now: () => now,
    setIntervalFn: (callback) => { tick = callback; return 1; },
    clearIntervalFn: () => {},
    ...overrides,
  });
  return { client, advance: (ms) => { now += ms; }, tick: () => tick() };
}

test("connects to /events and reports an open connection", () => {
  const { client } = makeClient();
  const statuses = [];
  client.on("connection", (status) => statuses.push(status));
  client.connect();
  assert.equal(FakeEventSource.latest.url, "/events");
  FakeEventSource.latest.emit("open");
  assert.deepEqual(statuses.at(-1), { connected: true, label: "Conectado" });
});

test("forwards parsed state and log events", () => {
  const { client } = makeClient();
  const states = [];
  const logs = [];
  client.on("state", (state) => states.push(state));
  client.on("log", (line) => logs.push(line));
  client.connect();
  FakeEventSource.latest.emit("state", '{"id":"sensor/demo","state":"21"}');
  FakeEventSource.latest.emit("log", "[I][demo]: ready");
  assert.equal(states[0].state, "21");
  assert.equal(logs[0], "[I][demo]: ready");
});

test("reports malformed state payloads without throwing", () => {
  const { client } = makeClient();
  let error;
  client.on("protocolError", (value) => { error = value; });
  client.connect();
  FakeEventSource.latest.emit("state", "{invalid");
  assert.ok(error instanceof Error);
});

test("marks the connection lost after the heartbeat timeout and recovers on ping", () => {
  const { client, advance, tick } = makeClient();
  const statuses = [];
  client.on("connection", (status) => statuses.push(status));
  client.connect();
  advance(26000);
  tick();
  assert.equal(statuses.at(-1).label, "Sin comunicación");
  FakeEventSource.latest.emit("ping");
  assert.deepEqual(statuses.at(-1), { connected: true, label: "Conectado" });
});

test("uses native EventSource error/reconnection status", () => {
  const { client } = makeClient();
  let status;
  client.on("connection", (value) => { status = value; });
  client.connect();
  FakeEventSource.latest.emit("error");
  assert.deepEqual(status, { connected: false, label: "Reconectando…" });
});

test("sends REST commands with encoded entity path and query parameters", async () => {
  let request;
  const { client } = makeClient({
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, status: 200 };
    },
  });
  await client.command("light/Luz RGB demo", "turn_on", new URLSearchParams({ r: "255" }));
  assert.deepEqual(request, {
    url: "/light/Luz%20RGB%20demo/turn_on?r=255",
    options: { method: "POST" },
  });
});

test("throws when ESPHome rejects a REST command", async () => {
  const { client } = makeClient({
    fetchImpl: async () => ({ ok: false, status: 500 }),
  });
  await assert.rejects(client.command("switch/demo", "turn_on"), /HTTP 500/);
});

test("close releases the event stream and heartbeat timer", () => {
  const { client } = makeClient();
  client.connect();
  const stream = FakeEventSource.latest;
  client.close();
  assert.equal(stream.closed, true);
  assert.equal(client.events, null);
  assert.equal(client.heartbeatTimer, null);
});
