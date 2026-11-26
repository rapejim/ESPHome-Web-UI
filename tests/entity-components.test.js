"use strict";
const test=require("node:test");const assert=require("node:assert/strict");
const {getSensorPresentation}=require("../web/src/sensor-component.js");
const {getBinarySensorPresentation}=require("../web/src/binary-sensor-component.js");
test("sensor presentation includes name, state and unit",()=>{assert.deepEqual(getSensorPresentation({name:"Temperatura",state:"21.7",attributes:{unit_of_measurement:"°C",device_class:"temperature"}}),{name:"Temperatura",value:"21.7",unit:"°C",description:"temperature"});});
test("sensor presentation has safe fallbacks",()=>{assert.equal(getSensorPresentation({objectId:"custom",state:null,attributes:{}}).value,"—");});
test("binary sensor normalizes ON and OFF",()=>{assert.equal(getBinarySensorPresentation({state:"ON"}).active,true);assert.equal(getBinarySensorPresentation({state:"OFF"}).active,false);assert.equal(getBinarySensorPresentation({state:true}).value,"Activo");assert.equal(getBinarySensorPresentation({state:false}).value,"Inactivo");});
test("unknown binary sensor state remains explicit",()=>{assert.equal(getBinarySensorPresentation({state:"unknown"}).value,"Desconocido");});
