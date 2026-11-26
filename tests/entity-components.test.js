"use strict";
const test=require("node:test");const assert=require("node:assert/strict");
const {getSensorPresentation}=require("../web/src/sensor-component.js");
const {getBinarySensorPresentation}=require("../web/src/binary-sensor-component.js");
test("sensor presentation keeps the ESPHome unit and optional description separate",()=>{assert.deepEqual(getSensorPresentation({name:"Humedad",state:"49.3",description:"Sonda interior",attributes:{unit_of_measurement:"%"}}),{name:"Humedad",value:"49.3",unit:"%",description:"Sonda interior"});});
test("sensor presentation has safe fallbacks",()=>{assert.equal(getSensorPresentation({objectId:"custom",state:null,attributes:{}}).value,"—");});
test("binary sensor normalizes ON and OFF",()=>{assert.equal(getBinarySensorPresentation({state:"ON"}).active,true);assert.equal(getBinarySensorPresentation({state:"OFF"}).active,false);assert.equal(getBinarySensorPresentation({state:true}).value,"Activo");assert.equal(getBinarySensorPresentation({state:false}).value,"Inactivo");});
test("unknown binary sensor state remains explicit",()=>{assert.equal(getBinarySensorPresentation({state:"unknown"}).value,"Desconocido");});
