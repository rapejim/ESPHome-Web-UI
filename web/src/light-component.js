(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)Object.assign(root,api);
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  function getLightPresentation(entity){
    const attributes=entity.attributes||{};
    const color=attributes.color;
    const supportsColor=!!color&&["r","g","b"].every((key)=>Number.isFinite(Number(color[key])));
    const brightness=Number(attributes.brightness);
    const supportsBrightness=attributes.brightness!==undefined&&Number.isFinite(brightness);
    const isOn=entity.state==="ON"||entity.state===true;
    return {
      name:entity.name||entity.objectId||"Luz",
      isOn,
      state:isOn?"Encendida":"Apagada",
      supportsColor,
      supportsBrightness,
      brightness:supportsBrightness?Math.max(0,Math.min(255,brightness)):255,
      color:supportsColor?color:null
    };
  }

  function channelHex(value){
    return Math.round(Math.max(0,Math.min(255,Number(value)))).toString(16).padStart(2,"0");
  }

  function createLightCard(entity,onCommand){
    const card=document.createElement("article");
    card.className="card light-card actuator-card";
    card.dataset.entityId=entity.id;
    card.innerHTML='<div class="light-heading"><div><h3 class="actuator-name"></h3><p class="muted actuator-state"></p></div><span class="light-preview"></span></div><div class="light-controls"><label class="color-control light-color-control" hidden><span>Color</span><input class="light-color" type="color" value="#ffffff" aria-label="Elegir color"></label><label class="brightness-control" hidden><span>Brillo</span><input class="light-brightness" type="range" min="0" max="255" step="1" value="255"><output class="brightness-value">100 %</output></label><div class="actuator-actions"><button class="button secondary light-on" type="button">Encender</button><button class="button secondary light-off" type="button">Apagar</button><button class="button primary light-apply" type="button" hidden>Aplicar ajustes</button></div></div>';
    const colorInput=card.querySelector(".light-color");
    const brightnessInput=card.querySelector(".light-brightness");
    brightnessInput.addEventListener("input",()=>{
      card.querySelector(".brightness-value").textContent=`${Math.round(Number(brightnessInput.value)/255*100)} %`;
    });
    card.querySelector(".light-on").addEventListener("click",()=>onCommand(entity.id,"turn_on"));
    card.querySelector(".light-off").addEventListener("click",()=>onCommand(entity.id,"turn_off"));
    card.querySelector(".light-apply").addEventListener("click",()=>{
      const params=new URLSearchParams({transition:"0.3"});
      if(!card.querySelector(".brightness-control").hidden)params.set("brightness",brightnessInput.value);
      if(!card.querySelector(".light-color-control").hidden){
        const hex=colorInput.value;
        params.set("r",String(Number.parseInt(hex.slice(1,3),16)));
        params.set("g",String(Number.parseInt(hex.slice(3,5),16)));
        params.set("b",String(Number.parseInt(hex.slice(5,7),16)));
      }
      onCommand(entity.id,"turn_on",params);
    });
    updateLightCard(card,entity);
    return card;
  }

  function updateLightCard(card,entity){
    const view=getLightPresentation(entity);
    card.querySelector(".actuator-name").textContent=view.name;
    card.querySelector(".actuator-state").textContent=view.state;
    card.querySelector(".light-on").disabled=view.isOn;
    card.querySelector(".light-off").disabled=!view.isOn;
    const colorControl=card.querySelector(".light-color-control");
    const brightnessControl=card.querySelector(".brightness-control");
    const apply=card.querySelector(".light-apply");
    colorControl.hidden=!view.supportsColor;
    brightnessControl.hidden=!view.supportsBrightness;
    apply.hidden=!view.supportsColor&&!view.supportsBrightness;
    if(view.supportsColor){
      const hex=`#${channelHex(view.color.r)}${channelHex(view.color.g)}${channelHex(view.color.b)}`;
      const input=card.querySelector(".light-color");
      if(document.activeElement!==input)input.value=hex;
      card.querySelector(".light-preview").style.backgroundColor=hex;
    }
    if(view.supportsBrightness){
      const input=card.querySelector(".light-brightness");
      if(document.activeElement!==input)input.value=String(view.brightness);
      card.querySelector(".brightness-value").textContent=`${Math.round(view.brightness/255*100)} %`;
    }
  }

  return {getLightPresentation,createLightCard,updateLightCard};
});
