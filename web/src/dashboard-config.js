(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)Object.assign(root,api);
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // Edita este objeto para adaptar el dashboard a las entidades de tu dispositivo.
  // Los identificadores usan name_id y, como alternativa, id (por ejemplo: "sensor/Temperatura").
  const DASHBOARD_CONFIG = {
    deviceName: "",
    subtitle: "",
    showUnconfiguredEntities: true,
    groups: [
      {id:"readings",title:"Estado ambiental",domains:["sensor"],layout:"sensors",order:10},
      {id:"binary",title:"Sensores binarios",domains:["binary_sensor"],layout:"sensors",order:20},
      {id:"controls",title:"Controles",domains:["switch","button","light"],layout:"controls",order:30}
    ],
    entities: {
      // "sensor/Temperatura demo": {visible:true,label:"Temperatura exterior",unit:"°C",group:"readings",order:10},
      // "switch/Interruptor demo": {visible:false}
    }
  };

  function getDashboardEntityConfig(entity, config=DASHBOARD_CONFIG){
    const custom=config.entities?.[entity.id]||{};
    const groupId=custom.group||config.groups.find((group)=>group.domains.includes(entity.domain))?.id||"other";
    const group=config.groups.find((item)=>item.id===groupId)||{
      id:"other",title:"Otras entidades",layout:["sensor","binary_sensor"].includes(entity.domain)?"sensors":"controls",order:1000
    };
    return {
      visible:custom.visible===undefined?config.showUnconfiguredEntities!==false:custom.visible===true,
      label:custom.label||entity.name,
      unit:custom.unit||"",
      group,
      order:Number.isFinite(Number(custom.order))?Number(custom.order):1000
    };
  }

  return {DASHBOARD_CONFIG,getDashboardEntityConfig};
});
