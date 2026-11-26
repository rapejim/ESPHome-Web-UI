const test = require("node:test");
const assert = require("node:assert/strict");
const { DASHBOARD_CONFIG, mergeDashboardConfig, getDashboardEntityConfig } = require("../web/src/dashboard-config");

test("uses the domain's default group and displays unconfigured entities", () => {
  const result = getDashboardEntityConfig({id:"sensor/Temp",domain:"sensor",name:"Temp"});
  assert.equal(result.visible,true);
  assert.equal(result.group.id,"readings");
  assert.equal(result.label,"Temp");
});

test("supports explicit entity visibility, labels, descriptions, groups and order", () => {
  const config = {
    showUnconfiguredEntities:false,
    groups:[{id:"room",title:"Habitación",domains:["sensor"],layout:"sensors",order:1}],
    entities:{"sensor/Temp":{visible:true,label:"Temperatura",description:"Sonda exterior",group:"room",order:5}}
  };
  const result = getDashboardEntityConfig({id:"sensor/Temp",domain:"sensor",name:"Temp"},config);
  assert.equal(result.visible,true);
  assert.equal(result.label,"Temperatura");
  assert.equal(result.description,"Sonda exterior");
  assert.equal(result.group.id,"room");
  assert.equal(result.order,5);
  assert.equal(getDashboardEntityConfig({id:"sensor/Other",domain:"sensor",name:"Other"},config).visible,false);
});

test("saved configuration overrides defaults without mutating them", () => {
  const saved={groups:[{id:"custom",title:"Personalizado",domains:["sensor"],layout:"sensors",order:1}],entities:{"sensor/Temp":{visible:true}}};
  const merged=mergeDashboardConfig(DASHBOARD_CONFIG,saved);
  assert.equal(merged.groups[0].id,"custom");
  assert.equal(merged.entities["sensor/Temp"].visible,true);
  assert.equal(DASHBOARD_CONFIG.groups[0].id,"readings");
});

test("supports hiding a default entity", () => {
  const config = {...DASHBOARD_CONFIG,entities:{"light/Accent":{visible:false}}};
  assert.equal(getDashboardEntityConfig({id:"light/Accent",domain:"light",name:"Accent"},config).visible,false);
});
