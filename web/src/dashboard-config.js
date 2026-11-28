(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root)Object.assign(root,api);
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const DASHBOARD_CONFIG={deviceName:"",subtitle:"",showUnconfiguredEntities:true,groups:[
  {id:"readings",title:"Estado ambiental",domains:["sensor"],layout:"sensors",order:10},
  {id:"binary",title:"Sensores binarios",domains:["binary_sensor"],layout:"sensors",order:20},
  {id:"controls",title:"Controles",domains:["switch","button","light"],layout:"controls",order:30}],entities:{}};
 const clone=value=>JSON.parse(JSON.stringify(value));
 function mergeDashboardConfig(base,saved){
  if(!saved||typeof saved!=="object"||Array.isArray(saved))return base;
  let groups=base.groups;
  if(Array.isArray(saved.groups))groups=saved.groups.filter(g=>g&&typeof g.id==="string"&&(base.groups.some(x=>x.id===g.id)||(typeof g.title==="string"&&Array.isArray(g.domains))))
   .map(g=>{const original=base.groups.find(x=>x.id===g.id);return {...(original||{}),...g,domains:Array.isArray(g.domains)?g.domains:[...(original?.domains||[])]};})
   .filter(g=>typeof g.title==="string"&&Array.isArray(g.domains));
  const entities=saved.entities&&typeof saved.entities==="object"&&!Array.isArray(saved.entities)?Object.fromEntries(Object.entries(saved.entities).filter(([,v])=>v&&typeof v==="object"&&!Array.isArray(v))):{};
  return {...base,deviceName:typeof saved.deviceName==="string"?saved.deviceName:base.deviceName,subtitle:typeof saved.subtitle==="string"?saved.subtitle:base.subtitle,
   showUnconfiguredEntities:typeof saved.showUnconfiguredEntities==="boolean"?saved.showUnconfiguredEntities:base.showUnconfiguredEntities,groups,entities:{...base.entities,...entities}};
 }
 function getDashboardEntityConfig(entity,config=DASHBOARD_CONFIG){
  const custom=config.entities?.[entity.id]||{},compatible=config.groups.filter(g=>g.domains.includes(entity.domain));
  const group=compatible.find(g=>g.id===custom.group)||compatible[0]||{id:"other",title:"Otras entidades",layout:["sensor","binary_sensor"].includes(entity.domain)?"sensors":"controls",order:1000};
  return {visible:custom.visible===undefined?config.showUnconfiguredEntities!==false:custom.visible===true,label:custom.label||entity.name,description:custom.description||"",group,order:Number.isFinite(Number(custom.order))?Number(custom.order):1000};
 }
 function serializeDashboardConfig(config,entityList=[]){
  const saved={};if(config.deviceName)saved.deviceName=config.deviceName;if(config.subtitle)saved.subtitle=config.subtitle;
  if(config.showUnconfiguredEntities!==true)saved.showUnconfiguredEntities=config.showUnconfiguredEntities;
  const defaults=new Map(DASHBOARD_CONFIG.groups.map(g=>[g.id,g]));
  const groupDiff=config.groups.length!==DASHBOARD_CONFIG.groups.length||config.groups.some(g=>{const d=defaults.get(g.id);return !d||g.title!==d.title||JSON.stringify(g.domains)!==JSON.stringify(d.domains)||g.layout!==d.layout||g.order!==d.order;});
  if(groupDiff)saved.groups=config.groups.map(g=>{const d=defaults.get(g.id);if(!d)return clone(g);const item={id:g.id};if(g.title!==d.title)item.title=g.title;if(JSON.stringify(g.domains)!==JSON.stringify(d.domains))item.domains=clone(g.domains);if(g.layout!==d.layout)item.layout=g.layout;if(g.order!==d.order)item.order=g.order;return item;});
  const byId=new Map(entityList.map(e=>[e.id,e])),entities={};
  for(const [id,c] of Object.entries(config.entities||{})){const e=byId.get(id),d={};
   if(c.visible!==undefined&&c.visible!==(config.showUnconfiguredEntities!==false))d.visible=c.visible;
   if(c.label&&(!e||c.label!==e.name))d.label=c.label;if(c.description)d.description=c.description;
   if(c.group){const compatible=config.groups.filter(g=>e&&g.domains.includes(e.domain));if(!compatible[0]||c.group!==compatible[0].id)d.group=c.group;}
   if(c.order!==undefined&&c.order!==1000)d.order=c.order;if(Object.keys(d).length)entities[id]=d;
  }
  if(Object.keys(entities).length)saved.entities=entities;return saved;
 }
 return {DASHBOARD_CONFIG,mergeDashboardConfig,getDashboardEntityConfig,serializeDashboardConfig};
});