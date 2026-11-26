(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)Object.assign(root,api);
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  function getSwitchPresentation(entity){
    const raw=entity.state;
    const isOn=raw===true||raw===1||raw==="ON"||raw==="on"||raw==="true";
    const isOff=raw===false||raw===0||raw==="OFF"||raw==="off"||raw==="false";
    return {
      name:entity.name||entity.objectId||"Interruptor",
      isOn:isOn?true:isOff?false:null,
      state:isOn?"Encendido":isOff?"Apagado":"Desconocido",
      action:isOn?"turn_off":"turn_on",
      actionLabel:isOn?"Apagar":"Encender"
    };
  }

  function createSwitchCard(entity,onCommand){
    const card=document.createElement("article");
    card.className="card control-card actuator-card";
    card.dataset.entityId=entity.id;
    card.innerHTML='<div class="control-copy"><div class="control-icon" aria-hidden="true">◉</div><div><h3 class="actuator-name"></h3><p class="muted actuator-state"></p></div></div><button class="button secondary actuator-action" type="button"></button>';
    card.querySelector(".actuator-action").addEventListener("click",()=>{
      const action=card.dataset.action||"turn_on";
      onCommand(entity.id,action);
    });
    updateSwitchCard(card,entity);
    return card;
  }

  function updateSwitchCard(card,entity){
    const view=getSwitchPresentation(entity);
    card.querySelector(".actuator-name").textContent=view.name;
    card.querySelector(".actuator-state").textContent=view.state;
    const button=card.querySelector(".actuator-action");
    button.textContent=view.actionLabel;
    button.disabled=false;
    card.dataset.action=view.action;
  }

  return {getSwitchPresentation,createSwitchCard,updateSwitchCard};
});
