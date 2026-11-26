(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.DashboardEditor=api.DashboardEditor;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const DOMAINS=["sensor","binary_sensor","switch","button","light"];
  const el=(tag,attrs={},text)=>{const node=document.createElement(tag);for(const [key,value] of Object.entries(attrs)){if(key==="class")node.className=value;else if(key==="checked")node.checked=value;else node.setAttribute(key,value);}if(text!==undefined)node.textContent=text;return node;};
  class DashboardEditor extends HTMLElement{
    setData(config,entities,onSave){
      this.config=config;this.entities=entities;this.onSave=onSave;this.render();
    }
    render(){
      if(!this.config||!this.entities)return;
      const details=el("details",{class:"dashboard-editor"});
      const summary=el("summary",{},"⚙ Configurar dashboard");
      details.append(summary);
      const body=el("div",{class:"editor-body"});
      const intro=el("p",{class:"editor-help"},"Los cambios se guardan en el dispositivo y se conservan tras reiniciarlo.");
      body.append(intro);
      const name=el("input",{type:"text",maxlength:"48",class:"editor-input",value:this.config.deviceName||""});
      const subtitle=el("input",{type:"text",maxlength:"64",class:"editor-input",value:this.config.subtitle||""});
      body.append(this.field("Nombre del panel",name),this.field("Subtítulo",subtitle));
      const show=el("input",{type:"checkbox",checked:this.config.showUnconfiguredEntities!==false});
      body.append(this.field("Mostrar entidades nuevas automáticamente",show));
      const groupBox=el("div",{class:"editor-group-tools"});
      const newGroup=el("input",{type:"text",maxlength:"24",class:"editor-input",placeholder:"Nombre del nuevo grupo"});
      const addGroup=el("button",{type:"button",class:"button secondary"},"Añadir grupo");
      groupBox.append(newGroup,addGroup);
      body.append(el("h3",{},"Grupos"),groupBox);
      const groupList=el("div",{class:"editor-groups"});
      this.config.groups.forEach(g=>groupList.append(el("span",{class:"editor-chip"},g.title)));
      body.append(groupList,el("h3",{},"Entidades"));
      const list=el("div",{class:"editor-entities"});
      const rows=[];
      this.entities.slice().sort((a,b)=>a.name.localeCompare(b.name,"es")).forEach(entity=>{
        const custom=this.config.entities[entity.id]||{};
        const row=el("div",{class:"editor-entity"});
        const visible=el("input",{type:"checkbox",checked:custom.visible===undefined?this.config.showUnconfiguredEntities!==false:custom.visible===true});
        const title=el("strong",{},entity.name||entity.id);
        const id=el("small",{},entity.id);
        const copy=el("div",{class:"editor-entity-copy"});copy.append(title,id);
        const label=el("input",{type:"text",maxlength:"32",class:"editor-input",placeholder:"Etiqueta",value:custom.label||""});
        const description=el("input",{type:"text",maxlength:"40",class:"editor-input",placeholder:"Descripción",value:custom.description||""});
        const group=el("select",{class:"editor-input"});
        this.config.groups.forEach(g=>group.append(el("option",{value:g.id},g.title)));
        const defaultGroup=this.config.groups.find(g=>g.domains.includes(entity.domain));
        group.append(el("option",{value:"other"},"Otras entidades"));
        group.value=custom.group||(defaultGroup?defaultGroup.id:"other");
        const order=el("input",{type:"number",min:"0",max:"999",step:"1",class:"editor-order",value:custom.order===undefined?"":String(custom.order),placeholder:"Auto"});
        row.append(this.field("Mostrar",visible),copy,this.field("Etiqueta",label),this.field("Descripción",description),this.field("Grupo",group),this.field("Orden",order));
        list.append(row);
        rows.push({entity,visible,label,description,group,order});
      });
      body.append(list);
      const footer=el("div",{class:"editor-footer"});
      const size=el("span",{class:"editor-size"});
      const save=el("button",{type:"button",class:"button primary"},"Guardar cambios");
      const status=el("span",{class:"editor-status","aria-live":"polite"});
      footer.append(size,save,status);body.append(footer);details.append(body);
      const buildConfig=()=>{
        const entities={};
        rows.forEach(r=>{
          const c={};
          if(r.visible.checked!==(show.checked))c.visible=r.visible.checked;
          const labelValue=r.label.value.trim();
          if(labelValue&&labelValue!==r.entity.name)c.label=labelValue;
          const desc=r.description.value.trim();if(desc)c.description=desc;
          const defaultGroup=this.config.groups.find(g=>g.domains.includes(r.entity.domain));
          const groupValue=r.group.value;
          if(groupValue!==(defaultGroup?defaultGroup.id:"other"))c.group=groupValue;
          if(r.order.value.trim()!=="")c.order=Math.max(0,Math.min(999,Number(r.order.value)||0));
          if(Object.keys(c).length)entities[r.entity.id]=c;
        });
        return {deviceName:name.value.trim(),subtitle:subtitle.value.trim(),showUnconfiguredEntities:show.checked,groups:this.config.groups,entities};
      };
      const updateSize=()=>{
        const bytes=new TextEncoder().encode(JSON.stringify(buildConfig())).length;
        size.textContent="Configuración: "+bytes+"/768 bytes";
        size.classList.toggle("over-limit",bytes>768);
        save.disabled=bytes>768;
      };
      [name,subtitle,show,...rows.flatMap(r=>[r.visible,r.label,r.description,r.group,r.order])].forEach(input=>input.addEventListener("input",updateSize));
      addGroup.addEventListener("click",()=>{
        const title=newGroup.value.trim();if(!title)return;
        let id=title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,18);
        if(!id||this.config.groups.some(g=>g.id===id)){status.textContent="Nombre de grupo no válido o repetido.";return;}
        const domains=DOMAINS.slice();
        this.config.groups.push({id,title,domains,layout:"controls",order:(this.config.groups.length+1)*10});
        newGroup.value="";this.render();
        const reopened=this.querySelector("details");if(reopened)reopened.open=true;
      });
      save.addEventListener("click",async()=>{
        const config=buildConfig();save.disabled=true;status.textContent="Guardando…";
        try{await this.onSave(config);status.textContent="Guardado correctamente.";}
        catch(error){status.textContent=error.message||"No se pudo guardar.";}
        save.disabled=false;
      });
      this.replaceChildren(details);updateSize();
    }
    field(label,control){const wrapper=el("label",{class:"editor-field"});wrapper.append(el("span",{},label),control);return wrapper;}
  }
  if(typeof customElements!=="undefined"&&!customElements.get("dashboard-editor"))customElements.define("dashboard-editor",DashboardEditor);
  return {DashboardEditor};
});