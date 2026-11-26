const test = require("node:test");
const assert = require("node:assert/strict");
const { DASHBOARD_CONFIG, getDashboardEntityConfig } = require("../web/src/dashboard-config");

test("uses the domain's default group and displays unconfigured entities", () => {
  const result = getDashboardEntityConfig({id:"sensor/Temp",domain:"sensor",name:"Temp"});
  assert.equal(result.visible,true);
  assert.equal(result.group.id,"readings");
  assert.equal(result.label,"Temp");
});

test("supports explicit entity visibility, labels, units, groups and order", () => {
  const config = {
    showUnconfiguredEntities:false,
    groups:[{id:"room",title:"Habitación",domains:["sensor"],layout:"sensors",order:1}],
    entities:{"sensor/Temp":{visible:true,label:"Temperatura",unit:"°C",group:"room",order:5}}
  };
  const result = getDashboardEntityConfig({id:"sensor/Temp",domain:"sensor",name:"Temp"},config);
  assert.equal(result.visible,true);
  assert.equal(result.label,"Temperatura");
  assert.equal(result.unit,"°C");
  assert.equal(result.group.id,"room");
  assert.equal(result.order,5);
  assert.equal(getDashboardEntityConfig({id:"sensor/Other",domain:"sensor",name:"Other"},config).visible,false);
});

test("supports hiding a default entity", () => {
  const config = {...DASHBOARD_CONFIG,entities:{"light/Accent":{visible:false}}};
  assert.equal(getDashboardEntityConfig({id:"light/Accent",domain:"light",name:"Accent"},config).visible,false);
});
