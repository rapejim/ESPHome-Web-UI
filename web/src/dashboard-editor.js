(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.DashboardEditor=api.DashboardEditor;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const DOMAINS=["sensor","binary_sensor","switch","button","light"];
  const el=(tag,attrs={},text)=>{const node=document.createElement(tag);for(const [key,value] of Object.entries(attrs)){if(key==="class")node.className=value;else if(key==="checked")node.checked=value;else node.setAttribute(key,value);}if(text!==undefined)node.textContent=text;return node;};
  const cloneGroups=groups=>groups.map(group=>({...group,domains:[...group.domains]}));
  class DashboardEditor extends HTMLElement{
    setData(config,entities,onSave){this.config=config;this.entities=entities;this.onSave=onSave;this.render();}
    field(label,control){const wrapper=el("label",{class:"editor-field"});wrapper.append(el("span",{},label),control);return wrapper;}
    render(){
      if(!this.config||!this.entities)return;
      const groups=cloneGroups(this.config.groups||[]);
      const details=el("details",{class:"dashboard-editor"});
      details.append(el("summary",{},"⚙ Configurar dashboard"));
      const body=el("div",{class:"editor-body"});
      body.append(el("p",{class:"editor-help"},"Los cambios se guardan en el dispositivo y se conservan tras reiniciarlo."));
      const name=el("input",{type:"text",maxlength:"48",class:"editor-input",value:this.config.deviceName||""});
      const subtitle=el("input",{type:"text",maxlength:"64",class:"editor-input",value:this.config.subtitle||""});
      const show=el("input",{type:"checkbox",checked:this.config.showUnconfiguredEntities!==false});
      body.append(this.field("Nombre del panel",name),this.field("Subtítulo",subtitle),this.field("Mostrar entidades nuevas automáticamente",show));
      const groupSection=el("details",{class:"editor-subsection"});
      groupSection.append(el("summary",{},"Grupos"));
      const groupContent=el("div",{class:"editor-subsection-content"});
      const groupList=el("div",{class:"editor-groups"});
      const create=el("div",{class:"editor-group-create"});
      const newName=el("input",{type:"text",maxlength:"24",class:"editor-input",placeholder:"Nombre del grupo"});
      const domainChecks={};
      const domainBox=el("div",{class:"editor-domain-options"});
      DOMAINS.forEach(domain=>{const input=el("input",{type:"checkbox",checked:["sensor","binary_sensor"].includes(domain)});domainChecks[domain]=input;domainBox.append(this.field(domain,input));});
      const add=el("button",{type:"button",class:"button secondary"},"Añadir grupo");
      create.append(newName,domainBox,add);
      groupContent.append(create,groupList);
      groupSection.append(groupContent);
      body.append(groupSection);
      const entitySection=el("details",{class:"editor-subsection"});
      entitySection.append(el("summary",{},"Entidades"));
      const entityContent=el("div",{class:"editor-subsection-content"});
      const list=el("div",{class:"editor-entities"}),rows=[];
      this.entities.slice().sort((a,b)=>(a.name||a.id).localeCompare(b.name||b.id,"es")).forEach(entity=>{
        const custom=this.config.entities[entity.id]||{};
        const row=el("div",{class:"editor-entity"});
        const visible=el("input",{type:"checkbox",checked:custom.visible===undefined?show.checked:custom.visible===true});
        const copy=el("div",{class:"editor-entity-copy"});
        copy.append(el("strong",{},entity.name||entity.id),el("small",{},entity.id));
        const label=el("input",{type:"text",maxlength:"32",class:"editor-input",placeholder:"Etiqueta",value:custom.label||""});
        const description=el("input",{type:"text",maxlength:"40",class:"editor-input",placeholder:"Descripción",value:custom.description||""});
        const group=el("select",{class:"editor-input"});
        const order=el("input",{type:"number",min:"0",max:"999",step:"1",class:"editor-order",value:custom.order===undefined?"":String(custom.order),placeholder:"Auto"});
        row.append(this.field("Mostrar",visible),copy,this.field("Etiqueta",label),this.field("Descripción",description),this.field("Grupo",group),this.field("Orden",order));
        list.append(row);rows.push({entity,visible,label,description,group,order});
      });
      entityContent.append(list);
      entitySection.append(entityContent);
      body.append(entitySection);
      const footer=el("div",{class:"editor-footer"});
      const size=el("span",{class:"editor-size"});
      const save=el("button",{type:"button",class:"button primary"},"Guardar cambios");
      const reset=el("button",{type:"button",class:"button secondary"},"Restablecer valores de fábrica");
      const status=el("span",{class:"editor-status","aria-live":"polite"});
      footer.append(size,save,reset,status);body.append(footer);details.append(body);
      const compatibleGroups=entity=>groups.filter(g=>g.domains.includes(entity.domain));
      const defaultGroup=entity=>compatibleGroups(entity)[0];
      const refreshGroupOptions=()=>{
        rows.forEach(row=>{
          const previous=row.group.value||this.config.entities?.[row.entity.id]?.group;
          row.group.replaceChildren();
          const compatible=compatibleGroups(row.entity);
          compatible.forEach(group=>row.group.append(el("option",{value:group.id},group.title)));
          row.group.append(el("option",{value:"other"},"Otras entidades"));
          const fallback=defaultGroup(row.entity);
          row.group.value=compatible.some(g=>g.id===previous)?previous:(fallback?fallback.id:"other");
        });
      };
      const buildConfig=()=>{
        const entities={};
        rows.forEach(row=>{
          const custom={};
          if(row.visible.checked!==show.checked)custom.visible=row.visible.checked;
          const label=row.label.value.trim();if(label&&label!==row.entity.name)custom.label=label;
          const description=row.description.value.trim();if(description)custom.description=description;
          const fallback=defaultGroup(row.entity);
          if(row.group.value!==(fallback?fallback.id:"other"))custom.group=row.group.value;
          if(row.order.value.trim()!=="")custom.order=Math.max(0,Math.min(999,Number(row.order.value)||0));
          if(Object.keys(custom).length)entities[row.entity.id]=custom;
        });
        return serializeDashboardConfig({deviceName:name.value.trim(),subtitle:subtitle.value.trim(),showUnconfiguredEntities:show.checked,groups:cloneGroups(groups),entities},this.entities);
      };
      const updateSize=()=>{
        const bytes=new TextEncoder().encode(JSON.stringify(buildConfig())).length;
        size.textContent="Configuración: "+bytes+"/768 bytes";
        size.classList.toggle("over-limit",bytes>768);save.disabled=bytes>768;
      };
      const refreshGroups=()=>{
        groupList.replaceChildren();
        groups.forEach((group,index)=>{
          const card=el("div",{class:"editor-group"});
          const heading=el("div",{class:"editor-group-heading"});
          heading.append(el("strong",{},group.title));
          const groupOrder=el("input",{type:"number",min:"0",max:"999",step:"1",class:"editor-order",value:String(group.order??(index+1)*10),"aria-label":"Orden de "+group.title});
          groupOrder.addEventListener("input",()=>{group.order=Math.max(0,Math.min(999,Number(groupOrder.value)||0));updateSize();});
          const remove=el("button",{type:"button",class:"button danger"},"Eliminar");
          remove.addEventListener("click",()=>{
            const index=groups.findIndex(item=>item.id===group.id);if(index>=0)groups.splice(index,1);
            rows.forEach(row=>{if(row.group.value===group.id){const fallback=defaultGroup(row.entity);row.group.value=fallback?fallback.id:"other";}});
            refreshGroups();refreshGroupOptions();updateSize();
          });
          heading.append(this.field("Orden",groupOrder),remove);
          const title=el("input",{type:"text",maxlength:"24",class:"editor-input",value:group.title});
          title.addEventListener("input",()=>{group.title=title.value;heading.querySelector("strong").textContent=group.title;refreshGroupOptions();updateSize();});
          const domains=el("div",{class:"editor-domain-options"});
          DOMAINS.forEach(domain=>{
            const input=el("input",{type:"checkbox",checked:group.domains.includes(domain)});
            input.addEventListener("change",()=>{group.domains=input.checked?[...new Set([...group.domains,domain])]:group.domains.filter(item=>item!==domain);group.layout=group.domains.some(item=>["sensor","binary_sensor"].includes(item))?"sensors":"controls";refreshGroupOptions();updateSize();});
            domains.append(this.field(domain,input));
          });
          card.append(heading,this.field("Nombre",title),this.field("Dominios",domains));groupList.append(card);
        });
      };
      refreshGroups();refreshGroupOptions();
      show.addEventListener("change",()=>{rows.forEach(row=>row.visible.checked=show.checked);updateSize();});
      [name,subtitle,show,...rows.flatMap(row=>[row.visible,row.label,row.description,row.group,row.order])].forEach(input=>input.addEventListener("input",updateSize));
      add.addEventListener("click",()=>{
        const title=newName.value.trim();if(!title){status.textContent="Indica un nombre para el grupo.";return;}
        const id=title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,18);
        if(!id||groups.some(group=>group.id===id)){status.textContent="Nombre de grupo no válido o repetido.";return;}
        const domains=DOMAINS.filter(domain=>domainChecks[domain].checked);
        groups.push({id,title,domains,layout:domains.some(domain=>["sensor","binary_sensor"].includes(domain))?"sensors":"controls",order:(groups.length+1)*10});
        newName.value="";refreshGroups();refreshGroupOptions();updateSize();
      });
      save.addEventListener("click",async()=>{
        save.disabled=true;status.textContent="Guardando…";
        try{await this.onSave(buildConfig());status.textContent="Guardado correctamente.";}
        catch(error){status.textContent=error.message||"No se pudo guardar.";}
        save.disabled=false;
      });
      reset.addEventListener("click",async()=>{
        if(typeof globalThis.confirm==="function"&&!globalThis.confirm("Se perderán los cambios personalizados y se recuperará la configuración incluida en el firmware. ¿Continuar?"))return;
        reset.disabled=true;save.disabled=true;status.textContent="Restableciendo…";
        try{await this.onSave({});status.textContent="Configuración de fábrica restaurada.";}
        catch(error){status.textContent=error.message||"No se pudo restablecer.";}
        reset.disabled=false;save.disabled=false;
      });
      this.replaceChildren(details);updateSize();
    }
  }
  if(typeof customElements!=="undefined"&&!customElements.get("dashboard-editor"))customElements.define("dashboard-editor",DashboardEditor);
  return {DashboardEditor};
});