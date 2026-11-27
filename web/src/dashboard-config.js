(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)Object.assign(root,api);
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // Configuración predeterminada incluida en el firmware.
  const DASHBOARD_CONFIG = {
    deviceName: "",
    subtitle: "",
    showUnconfiguredEntities: true,
    groups: [
      {id:"readings",title:"Estado ambiental",domains:["sensor"],layout:"sensors",order:10},
      {id:"binary",title:"Sensores binarios",domains:["binary_sensor"],layout:"sensors",order:20},
      {id:"controls",title:"Controles",domains:["switch","button","light"],layout:"controls",order:30}
    ],
    entities: {}
  };

  function mergeDashboardConfig(base, saved){
    if(!saved||typeof saved!=="object"||Array.isArray(saved))return base;
    const groups=Array.isArray(saved.groups)?saved.groups.filter((group)=>
      group&&typeof group.id==="string"&&typeof group.title==="string"&&
      Array.isArray(group.domains)&&group.domains.every((domain)=>typeof domain==="string")
    ):base.groups;
    const entities=saved.entities&&typeof saved.entities==="object"&&!Array.isArray(saved.entities)
      ?Object.fromEntries(Object.entries(saved.entities).filter(([,value])=>value&&typeof value==="object"&&!Array.isArray(value)))
      :{};
    return {
      ...base,
      deviceName:typeof saved.deviceName==="string"?saved.deviceName:base.deviceName,
      subtitle:typeof saved.subtitle==="string"?saved.subtitle:base.subtitle,
      showUnconfiguredEntities:typeof saved.showUnconfiguredEntities==="boolean"?saved.showUnconfiguredEntities:base.showUnconfiguredEntities,
      groups,
      entities:{...base.entities,...entities}
    };
  }

  function getDashboardEntityConfig(entity, config=DASHBOARD_CONFIG){
    const custom=config.entities?.[entity.id]||{};
    const groupId=custom.group||config.groups.find((group)=>group.domains.includes(entity.domain))?.id||"other";
    const group=config.groups.find((item)=>item.id===groupId)||{
      id:"other",title:"Otras entidades",layout:["sensor","binary_sensor"].includes(entity.domain)?"sensors":"controls",order:1000
    };
    return {
      visible:custom.visible===undefined?config.showUnconfiguredEntities!==false:custom.visible===true,
      label:custom.label||entity.name,
      description:custom.description||"",
      group,
      order:Number.isFinite(Number(custom.order))?Number(custom.order):1000
    };
  }

  return {DASHBOARD_CONFIG,mergeDashboardConfig,getDashboardEntityConfig};
});
