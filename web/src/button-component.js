(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)Object.assign(root,api);
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  function getButtonPresentation(entity){
    return {name:entity.name||entity.objectId||"Botón",description:entity.attributes?.device_class||"Acción"};
  }

  function createButtonCard(entity,onPress){
    const card=document.createElement("article");
    card.className="card control-card actuator-card";
    card.dataset.entityId=entity.id;
    card.innerHTML='<div class="control-copy"><div class="control-icon" aria-hidden="true">↯</div><div><h3 class="actuator-name"></h3><p class="muted actuator-description"></p></div></div><button class="button primary actuator-action" type="button">Pulsar</button>';
    card.querySelector(".actuator-action").addEventListener("click",()=>onPress(entity.id,"press"));
    updateButtonCard(card,entity);
    return card;
  }

  function updateButtonCard(card,entity){
    const view=getButtonPresentation(entity);
    card.querySelector(".actuator-name").textContent=view.name;
    card.querySelector(".actuator-description").textContent=view.description;
  }

  return {getButtonPresentation,createButtonCard,updateButtonCard};
});
