"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {getSwitchPresentation}=require("../web/src/switch-component.js");
const {getButtonPresentation}=require("../web/src/button-component.js");
const {getLightPresentation}=require("../web/src/light-component.js");

test("switch derives explicit on/off commands without using toggle",()=>{
  assert.deepEqual(getSwitchPresentation({name:"Relé",state:"ON"}),{name:"Relé",isOn:true,state:"Encendido",action:"turn_off",actionLabel:"Apagar"});
  assert.equal(getSwitchPresentation({state:"OFF"}).action,"turn_on");
  assert.equal(getSwitchPresentation({state:"unknown"}).action,"turn_on");
});

test("button presentation uses entity name and a safe fallback",()=>{
  assert.deepEqual(getButtonPresentation({name:"Reiniciar WiFi",attributes:{device_class:"restart"}}),{name:"Reiniciar WiFi",description:"restart"});
  assert.equal(getButtonPresentation({}).name,"Botón");
});

test("light detects brightness and RGB capabilities from reported attributes",()=>{
  const view=getLightPresentation({name:"Luz RGB",state:"ON",attributes:{brightness:128,color:{r:255,g:10,b:0}}});
  assert.equal(view.isOn,true);
  assert.equal(view.supportsBrightness,true);
  assert.equal(view.brightness,128);
  assert.equal(view.supportsColor,true);
  assert.equal(view.color.g,10);
});

test("light without optional capabilities remains an on/off control",()=>{
  const view=getLightPresentation({state:"OFF",attributes:{}});
  assert.equal(view.isOn,false);
  assert.equal(view.supportsBrightness,false);
  assert.equal(view.supportsColor,false);
});

test("light clamps reported brightness to its valid range",()=>{
  assert.equal(getLightPresentation({attributes:{brightness:300}}).brightness,255);
  assert.equal(getLightPresentation({attributes:{brightness:-5}}).brightness,0);
});
