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

  function buildLightCommandParams({color="#ffffff",brightness=255,supportsColor=true,supportsBrightness=true}={}){
    const params=new URLSearchParams({transition:"0.3"});
    if(supportsBrightness)params.set("brightness",String(Math.max(0,Math.min(255,Math.round(Number(brightness))))));
    if(supportsColor){
      const hex=String(color).replace(/^#/,"");
      if(/^[0-9a-f]{6}$/i.test(hex)){
        params.set("r",String(Number.parseInt(hex.slice(0,2),16)));
        params.set("g",String(Number.parseInt(hex.slice(2,4),16)));
        params.set("b",String(Number.parseInt(hex.slice(4,6),16)));
      }
    }
    return params;
  }

  function createLightCard(entity,onCommand){
    const card=document.createElement("article");
    card.className="card light-card actuator-card";
    card.dataset.entityId=entity.id;
    card.innerHTML='<div class="light-heading"><div><h3 class="actuator-name"></h3><p class="muted actuator-state"></p></div><span class="light-preview"></span></div><div class="light-controls"><label class="color-control light-color-control" hidden><span>Color</span><input class="light-color" type="color" value="#ffffff" aria-label="Elegir color"></label><label class="brightness-control" hidden><span>Brillo</span><input class="light-brightness" type="range" min="0" max="255" step="1" value="255"><output class="brightness-value">100 %</output></label><div class="actuator-actions"><button class="button secondary light-on" type="button">Encender</button><button class="button secondary light-off" type="button">Apagar</button></div></div>';
    const colorInput=card.querySelector(".light-color");
    const brightnessInput=card.querySelector(".light-brightness");

    const currentSettings=()=>({
      color:colorInput.value,
      brightness:Number(brightnessInput.value),
      supportsColor:!card.querySelector(".light-color-control").hidden,
      supportsBrightness:!card.querySelector(".brightness-control").hidden
    });

    const sendSettings=async()=>{
      if(card._lightTimer)clearTimeout(card._lightTimer);
      card._lightTimer=null;
      if(!card._lightDirty)return;
      card._lightDirty=false;
      const settings=currentSettings();
      if(card._lightDraftTimer)clearTimeout(card._lightDraftTimer);
      card._lightDraft={...settings,expiresAt:Date.now()+3000};
      card._lightDraftTimer=setTimeout(()=>{
        card._lightDraft=null;
        if(card._lastEntity)updateLightCard(card,card._lastEntity);
      },3100);
      await onCommand(entity.id,"turn_on",buildLightCommandParams(settings));
    };

    const scheduleSettings=(delay)=>{
      card._lightDirty=true;
      if(card._lightTimer)clearTimeout(card._lightTimer);
      card._lightTimer=setTimeout(()=>{sendSettings();},delay);
    };

    brightnessInput.addEventListener("input",()=>{
      card.querySelector(".brightness-value").textContent=`${Math.round(Number(brightnessInput.value)/255*100)} %`;
    });
    brightnessInput.addEventListener("change",()=>scheduleSettings(100));
    colorInput.addEventListener("input",()=>{
      card.querySelector(".light-preview").style.backgroundColor=colorInput.value;
    });
    colorInput.addEventListener("change",()=>scheduleSettings(80));

    card.querySelector(".light-on").addEventListener("click",async()=>{
      if(card._lightDirty)await sendSettings();
      else await onCommand(entity.id,"turn_on",buildLightCommandParams(currentSettings()));
    });
    card.querySelector(".light-off").addEventListener("click",async()=>{
      if(card._lightDirty)await sendSettings();
      await onCommand(entity.id,"turn_off");
    });

    updateLightCard(card,entity);
    return card;
  }

  function updateLightCard(card,entity){
    card._lastEntity=entity;
    const view=getLightPresentation(entity);
    card.querySelector(".actuator-name").textContent=view.name;
    card.querySelector(".actuator-state").textContent=view.state;
    card.querySelector(".light-on").disabled=view.isOn;
    card.querySelector(".light-off").disabled=!view.isOn;
    const colorControl=card.querySelector(".light-color-control");
    const brightnessControl=card.querySelector(".brightness-control");
    colorControl.hidden=!view.supportsColor;
    brightnessControl.hidden=!view.supportsBrightness;
    card.classList.toggle("has-extra-controls",view.supportsColor||view.supportsBrightness);

    let draft=card._lightDraft;
    if(draft&&Date.now()>=draft.expiresAt){
      card._lightDraft=null;
      draft=null;
    }
    if(draft){
      const colorMatches=!draft.supportsColor||(
        view.supportsColor&&
        Number(view.color.r)===Number.parseInt(draft.color.slice(1,3),16)&&
        Number(view.color.g)===Number.parseInt(draft.color.slice(3,5),16)&&
        Number(view.color.b)===Number.parseInt(draft.color.slice(5,7),16)
      );
      const brightnessMatches=!draft.supportsBrightness||(
        view.supportsBrightness&&view.brightness===draft.brightness
      );
      if(colorMatches&&brightnessMatches){
        card._lightDraft=null;
        if(card._lightDraftTimer)clearTimeout(card._lightDraftTimer);
        draft=null;
      }
    }

    if(view.supportsColor){
      const hex=draft?.supportsColor?draft.color:`#${channelHex(view.color.r)}${channelHex(view.color.g)}${channelHex(view.color.b)}`;
      const input=card.querySelector(".light-color");
      if(!draft&&document.activeElement!==input)input.value=hex;
      if(draft)input.value=hex;
      card.querySelector(".light-preview").style.backgroundColor=hex;
    }
    if(view.supportsBrightness){
      const brightness=draft?.supportsBrightness?draft.brightness:view.brightness;
      const input=card.querySelector(".light-brightness");
      if(!draft&&document.activeElement!==input)input.value=String(brightness);
      if(draft)input.value=String(brightness);
      card.querySelector(".brightness-value").textContent=`${Math.round(brightness/255*100)} %`;
    }
  }

  return {getLightPresentation,buildLightCommandParams,createLightCard,updateLightCard};
});
