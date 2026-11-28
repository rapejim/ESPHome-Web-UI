const test = require("node:test");
const assert = require("node:assert/strict");
const { DASHBOARD_CONFIG, mergeDashboardConfig, getDashboardEntityConfig, serializeDashboardConfig } = require("../web/src/dashboard-config");

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

test("ignores malformed saved group and entity entries", () => {
  const merged=mergeDashboardConfig(DASHBOARD_CONFIG,{groups:[null,{id:"ok",title:"Válido",domains:["sensor"]}],entities:{"sensor/Bad":null,"sensor/Good":{visible:false}}});
  assert.equal(merged.groups.length,1);
  assert.equal(merged.groups[0].id,"ok");
  assert.equal(merged.entities["sensor/Bad"],undefined);
  assert.equal(merged.entities["sensor/Good"].visible,false);
});

test("an empty saved configuration restores firmware defaults", () => {
  const merged=mergeDashboardConfig(DASHBOARD_CONFIG,{});
  assert.deepEqual(merged.groups,DASHBOARD_CONFIG.groups);
  assert.equal(merged.deviceName,"");
  assert.equal(merged.subtitle,"");
  assert.equal(merged.showUnconfiguredEntities,true);
  assert.deepEqual(merged.entities,{});
});

test("rejects entity groups that do not support their domain",()=>{const config=mergeDashboardConfig(DASHBOARD_CONFIG,{groups:[{id:"readings",title:"Estado ambiental",domains:["sensor"]},{id:"controls",title:"Controles",domains:["switch","button","light"]},{id:"new",title:"Nuevo grupo",domains:["switch","light"]}],entities:{"switch/Demo":{group:"readings"}}});assert.equal(getDashboardEntityConfig({id:"switch/Demo",domain:"switch",name:"Demo"},config).group.id,"controls");});
test("serializes an unchanged dashboard as an empty object",()=>{assert.deepEqual(serializeDashboardConfig(DASHBOARD_CONFIG,[]),{});});
test("serializes only changed default-group fields",()=>{const groups=DASHBOARD_CONFIG.groups.map(g=>({...g,domains:[...g.domains]}));groups[2].title="Iluminación";const saved=serializeDashboardConfig({...DASHBOARD_CONFIG,groups},[]);assert.deepEqual(saved.groups,[{id:"readings"},{id:"binary"},{id:"controls",title:"Iluminación"}]);assert.equal(mergeDashboardConfig(DASHBOARD_CONFIG,saved).groups[0].title,"Estado ambiental");});
