(function(){
"use strict";
if(window.__novaUpgradeLoaded)return;window.__novaUpgradeLoaded=true;
var KEY="nova_arcade_preferences_v2";
var defaults={theme:"system",view:"grid",density:"normal",columns:"auto",font:"normal",contrast:"normal",motion:"normal",descriptions:"show",covers:"show",sticky:"on",badges:"show",cardInfo:"full",imageLoad:"lazy",hover:"subtle",focus:"off"};
function read(){try{var v=JSON.parse(localStorage.getItem(KEY)||"{}");return Object.assign({},defaults,v&&typeof v==="object"?v:{});}catch(e){return Object.assign({},defaults);}}
var prefs=read();
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(e){}}
function apply(){
 var root=document.documentElement,body=document.body;
 root.dataset.theme=prefs.theme==="system"?"":prefs.theme;
 body.classList.toggle("nova-list-view",prefs.view==="list");
 body.dataset.novaDensity=prefs.density;body.dataset.novaColumns=prefs.columns;
 body.dataset.novaFont=prefs.font;body.dataset.novaContrast=prefs.contrast;
 body.dataset.novaMotion=prefs.motion;body.dataset.novaDescriptions=prefs.descriptions;
 body.dataset.novaCovers=prefs.covers;body.dataset.novaSticky=prefs.sticky;
 body.dataset.novaBadges=prefs.badges;body.dataset.novaCardInfo=prefs.cardInfo;
 body.dataset.novaHover=prefs.hover;body.classList.toggle("nova-focus-mode",prefs.focus==="on");
}
function el(tag,attrs,html){var n=document.createElement(tag);Object.keys(attrs||{}).forEach(function(k){if(k==="class")n.className=attrs[k];else if(k==="text")n.textContent=attrs[k];else n.setAttribute(k,attrs[k]);});if(html!==undefined)n.innerHTML=html;return n;}
function option(label,value,current){return '<option value="'+value+'"'+(current===value?" selected":"")+'>'+label+'</option>';}
var settings=[
 ["theme","Tema",["system|Automático","light|Claro","dark|Oscuro"]],
 ["view","Vista del catálogo",["grid|Cuadrícula","list|Lista"]],
 ["density","Densidad",["comfortable|Cómoda","normal|Normal","compact|Compacta"]],
 ["columns","Columnas",["auto|Automáticas","2|2 columnas","3|3 columnas","4|4 columnas","5|5 columnas"]],
 ["font","Tamaño de texto",["small|Pequeño","normal|Normal","large|Grande","xlarge|Muy grande"]],
 ["contrast","Contraste",["normal|Normal","high|Alto","soft|Suave"]],
 ["motion","Movimiento",["normal|Normal","reduced|Reducido","none|Desactivado"]],
 ["descriptions","Descripciones",["show|Mostrar","hide|Ocultar"]],
 ["covers","Portadas",["show|Mostrar","hide|Ocultar"]],
 ["sticky","Buscador fijo",["on|Activado","off|Desactivado"]],
 ["badges","Etiquetas de categoría",["show|Mostrar","hide|Ocultar"]],
 ["cardInfo","Información en tarjetas",["full|Completa","short|Reducida","minimal|Mínima"]],
 ["hover","Efectos al pasar el ratón",["subtle|Sutiles","off|Desactivados"]],
 ["focus","Modo concentración",["off|Desactivado","on|Activado"]]
];
function settingsMarkup(){return settings.map(function(s){return '<label class="nova-setting"><span>'+s[1]+'</span><select data-pref="'+s[0]+'">'+s[2].map(function(x){var p=x.split("|");return option(p[1],p[0],prefs[s[0]]);}).join("")+'</select></label>';}).join("");}
function openSettings(){
 var d=document.getElementById("novaSettings");if(!d){d=el("dialog",{id:"novaSettings",class:"nova-settings-dialog"});document.body.appendChild(d);}
 d.innerHTML='<div class="nova-dialog-head"><div><span class="nova-kicker">PERSONALIZACIÓN</span><h2>Tu NOVA ARCADE</h2><p>Configura la experiencia a tu gusto. Se guarda en este dispositivo.</p></div><button type="button" class="nova-icon-btn" data-nova-close aria-label="Cerrar">×</button></div><div class="nova-settings-grid">'+settingsMarkup()+'</div><div class="nova-dialog-actions"><button type="button" class="nova-action secondary" data-nova-reset>Restablecer</button><button type="button" class="nova-action primary" data-nova-close>Listo</button></div>';
 if(!d.open)d.showModal();
}
function addVisitorTools(app){
 if(!app||document.getElementById("novaVisitorTools"))return;
 var hero=app.querySelector(".hero");if(!hero)return;
 var bar=el("section",{id:"novaVisitorTools",class:"nova-visitor-tools","aria-label":"Herramientas del catálogo"});
 bar.innerHTML='<div class="nova-tools-intro"><span class="nova-kicker">TU EXPERIENCIA</span><strong>Personaliza cómo juegas</strong></div><div class="nova-tools-actions"><button type="button" class="nova-action" data-nova="settings">⚙ Preferencias</button><button type="button" class="nova-action" data-nova="view">▦ Cambiar vista</button><button type="button" class="nova-action" data-nova="theme">◐ Cambiar tema</button><button type="button" class="nova-action" data-nova="export-favs">♡ Exportar favoritos</button><button type="button" class="nova-action" data-nova="history">◷ Historial</button><button type="button" class="nova-action" data-nova="print">⎙ Imprimir catálogo</button><button type="button" class="nova-action" data-nova="share">↗ Compartir NOVA</button><button type="button" class="nova-action" data-nova="search">⌕ Ir al buscador</button><button type="button" class="nova-action" data-nova="random">🎲 Juego aleatorio</button><button type="button" class="nova-action" data-nova="favorites">♥ Ver favoritos</button><button type="button" class="nova-action" data-nova="clear">↺ Limpiar filtros</button><button type="button" class="nova-action" data-nova="reset">⟲ Restablecer preferencias</button></div>';
 hero.appendChild(bar);
}
function visibleCards(){return Array.from(document.querySelectorAll("#app .catalog-content .card"));}
function getCardName(card){var h=card.querySelector("h3");return h?h.textContent.trim():"Juego";}
function exportJson(name,data){var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"});downloadBlob(blob,name);}
function downloadBlob(blob,name){var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
function favoritesExport(){
 var ids=[];try{ids=JSON.parse(localStorage.getItem("na_favorites")||"[]");}catch(e){}
 var items=ids.map(function(id){var c=visibleCards().find(function(card){return card.querySelector("[data-fav]")&&card.querySelector("[data-fav]").dataset.fav===String(id);});return {id:String(id),name:c?getCardName(c):"Juego guardado"};});
 exportJson("nova-arcade-favoritos.json",{format:"nova-arcade-favorites-v1",exported_at:new Date().toISOString(),favorites:items});
}
function historyInfo(){var ids=[];try{ids=JSON.parse(localStorage.getItem("na_recent")||"[]");}catch(e){}var names=ids.map(function(id){return {id:String(id)};});alert("Historial local: "+names.length+" juegos recientes. Para continuar, usa la sección «Seguir jugando» de la portada.");}
function toggleTheme(){prefs.theme=prefs.theme==="dark"?"light":prefs.theme==="light"?"system":"dark";save();apply();refreshSettingsButton();}
function refreshSettingsButton(){var b=document.querySelector('[data-nova="theme"]');if(b)b.textContent=prefs.theme==="dark"?"☀ Tema claro":prefs.theme==="light"?"◐ Tema automático":"☾ Tema oscuro";var v=document.querySelector('[data-nova="view"]');if(v)v.textContent=prefs.view==="grid"?"☷ Vista de lista":"▦ Vista de cuadrícula";}
function focusSearch(){var input=document.querySelector("#s");if(input){input.focus();input.scrollIntoView({behavior:"smooth",block:"center"});}else location.hash="#";}
function sharePage(){var url=location.href;if(navigator.share){navigator.share({title:"NOVA ARCADE",text:"Descubre juegos online gratis en NOVA ARCADE",url:url}).catch(function(){});}else if(navigator.clipboard){navigator.clipboard.writeText(url).then(function(){toast("Enlace copiado.");}).catch(function(){prompt("Copia el enlace:",url);});}else prompt("Copia el enlace:",url);}
function toast(msg){var t=document.getElementById("novaToast");if(!t){t=el("div",{id:"novaToast","role":"status","aria-live":"polite"});document.body.appendChild(t);}t.textContent=msg;t.classList.add("show");clearTimeout(t._timer);t._timer=setTimeout(function(){t.classList.remove("show");},2200);}
function addAdminTools(app){
 if(!app||document.getElementById("novaAdminTools")||!document.getElementById("out")||!app.querySelector(".tabs"))return;
 var panel=el("section",{id:"novaAdminTools",class:"nova-admin-tools","aria-label":"Herramientas adicionales del administrador"});
 panel.innerHTML='<div class="nova-admin-head"><div><span class="nova-kicker">NOVA CONTROL CENTER</span><h2>Herramientas avanzadas</h2><p>Utilidades para revisar y gestionar los registros que aparecen en la página actual del catálogo.</p></div><span class="nova-admin-safe">Acceso administrador</span></div><div class="nova-admin-grid"><button class="nova-admin-tile" data-admin-tool="select">☑ Seleccionar visibles</button><button class="nova-admin-tile" data-admin-tool="invert">⇄ Invertir selección visible</button><button class="nova-admin-tile" data-admin-tool="clear">□ Limpiar selección</button><button class="nova-admin-tile" data-admin-tool="csv">⇩ Exportar página CSV</button><button class="nova-admin-tile" data-admin-tool="copy">⧉ Copiar listado visible</button><button class="nova-admin-tile" data-admin-tool="duplicates">⌕ Buscar duplicados visibles</button><button class="nova-admin-tile" data-admin-tool="empty">✎ Revisar nombres vacíos</button><button class="nova-admin-tile" data-admin-tool="urls">⌁ Validar IDs visibles</button><button class="nova-admin-tile" data-admin-tool="report">▤ Informe del catálogo</button><button class="nova-admin-tile" data-admin-tool="backup">▣ Crear copia JSON</button><button class="nova-admin-tile" data-admin-tool="import">⇧ Importar copia JSON</button><button class="nova-admin-tile" data-admin-tool="publish">✓ Publicar selección</button><button class="nova-admin-tile" data-admin-tool="hide">◌ Ocultar selección</button><button class="nova-admin-tile" data-admin-tool="feature">★ Destacar selección</button><button class="nova-admin-tile" data-admin-tool="unfeature">☆ Quitar destacados</button><button class="nova-admin-tile" data-admin-tool="delete">⌫ Eliminar selección</button><button class="nova-admin-tile" data-admin-tool="refresh">↻ Recargar catálogo</button><button class="nova-admin-tile" data-admin-tool="print">⎙ Imprimir informe</button><button class="nova-admin-tile" data-admin-tool="selectedCsv">⇩ Exportar selección CSV</button><button class="nova-admin-tile" data-admin-tool="selectedIds">⧉ Copiar IDs seleccionados</button><button class="nova-admin-tile" data-admin-tool="stats">▥ Estadísticas visibles</button><button class="nova-admin-tile" data-admin-tool="categories">▤ Resumen por categoría</button><button class="nova-admin-tile" data-admin-tool="published">✓ Filtrar publicados</button><button class="nova-admin-tile" data-admin-tool="hidden">◌ Filtrar ocultos</button></div><p class="nova-admin-feedback" id="novaAdminFeedback" role="status" aria-live="polite">Las acciones de selección afectan a los juegos visibles en la página actual; las acciones masivas existentes conservan sus confirmaciones.</p>';
 var tabs=app.querySelector(".tabs");if(tabs)tabs.insertAdjacentElement("afterend",panel);else app.appendChild(panel);
}
function adminRows(){return Array.from(document.querySelectorAll("#app .admin-game-row"));}
function adminChecks(){return adminRows().map(function(row){return row.querySelector("[data-select-game]");}).filter(Boolean);}
function selectedCount(){return adminChecks().filter(function(c){return c.checked;}).length;}
function adminFeedback(msg){var p=document.getElementById("novaAdminFeedback");if(p)p.textContent=msg;}
function clickExisting(id){var b=document.getElementById(id);if(b)b.click();else adminFeedback("Esta acción no está disponible con la selección actual.");}
function selectVisible(mode){
 var ids=adminChecks().map(function(c){return c.dataset.selectGame;});ids.forEach(function(id){var current=document.querySelector('[data-select-game="'+CSS.escape(id)+'"]');if(!current)return;var next=mode==="all"?true:mode==="invert"?!current.checked:false;if(current.checked!==next){current.checked=next;current.dispatchEvent(new Event("change",{bubbles:true}));}});
}
function csvExport(){
 var rows=adminRows().map(function(row){var c=row.querySelector("[data-select-game]"),name=row.querySelector(".t b"),small=row.querySelector(".t small");return [c?c.dataset.selectGame:"",name?name.textContent.trim():"",small?small.textContent.trim():""];});
 if(!rows.length){adminFeedback("No hay juegos visibles para exportar.");return;}
 var csv=["id,nombre,estado_categoria"].concat(rows.map(function(r){return r.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(",");})).join("\r\n");
 downloadBlob(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),"nova-arcade-pagina-visible.csv");adminFeedback("CSV creado con "+rows.length+" juegos de la página visible.");
}
function copyVisible(){
 var rows=adminRows().map(function(row){var n=row.querySelector(".t b"),s=row.querySelector(".t small"),c=row.querySelector("[data-select-game]");return (n?n.textContent.trim():"Juego")+" | "+(s?s.textContent.trim():"")+(c?" | "+c.dataset.selectGame:"");});
 var value=rows.join("\n");if(navigator.clipboard)navigator.clipboard.writeText(value).then(function(){adminFeedback("Listado visible copiado ("+rows.length+" juegos).");}).catch(function(){adminFeedback("El navegador no permitió copiar el listado.");});else adminFeedback(value);
}
function audit(type){
 var rows=adminRows(),issues=[];
 rows.forEach(function(row){var name=row.querySelector(".t b"),small=row.querySelector(".t small"),check=row.querySelector("[data-select-game]"),text=(small?small.textContent:"");
 if(type==="duplicates"&&check){var id=check.dataset.selectGame;if(rows.filter(function(r){var x=r.querySelector("[data-select-game]");return x&&x.dataset.selectGame===id;}).length>1)issues.push(name?name.textContent:"ID duplicado: "+id);}
 if(type==="empty"&&(!name||!name.textContent.trim()))issues.push("Juego sin nombre");
 if(type==="urls"&&check&&!/^[0-9a-f-]{36}$/i.test(check.dataset.selectGame||""))issues.push((name?name.textContent:"Juego")+": identificador no estándar");
 });
 if(type==="duplicates"&&issues.length===0)adminFeedback("No se han detectado IDs duplicados entre los "+rows.length+" juegos visibles.");
 else if(type==="empty"&&issues.length===0)adminFeedback("No se han detectado nombres vacíos entre los juegos visibles. La descripción completa no se expone en esta vista.");
 else if(type==="urls")adminFeedback("Comprobación local de identificadores completada. No se ha hecho una petición de red a las URLs de juego.");
 else adminFeedback(issues.length?"Revisar: "+issues.join(", "):"Auditoría completada sin incidencias en los datos visibles.");
}
function report(){
 var rows=adminRows(),published=rows.filter(function(r){return /Publicado/.test(r.textContent);}).length;
 var reportText="NOVA ARCADE — INFORME DE PÁGINA\nFecha: "+new Date().toLocaleString("es-ES")+"\nJuegos visibles: "+rows.length+"\nPublicados visibles: "+published+"\nOcultos visibles: "+(rows.length-published)+"\nSeleccionados: "+selectedCount()+"\n";
 exportJson("nova-arcade-informe.json",{generated_at:new Date().toISOString(),visible_rows:rows.length,published_visible:published,hidden_visible:rows.length-published,selected_visible:selectedCount(),note:"Este informe describe solo la página cargada, no el total de la base de datos."});
 adminFeedback(reportText.replace(/\n/g," · "));
}
function selectedRows(){return adminRows().filter(function(row){var c=row.querySelector("[data-select-game]");return c&&c.checked;});}
function selectedCsv(){var rows=selectedRows();if(!rows.length){adminFeedback("No hay juegos seleccionados en esta página.");return;}var values=rows.map(function(row){var c=row.querySelector("[data-select-game]"),n=row.querySelector(".t b"),s=row.querySelector(".t small");return [c.dataset.selectGame,n?n.textContent.trim():"",s?s.textContent.trim():""];});var csv=["id,nombre,estado_categoria"].concat(values.map(function(r){return r.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(",");})).join("\r\n");downloadBlob(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),"nova-arcade-seleccion.csv");adminFeedback("CSV creado con "+rows.length+" seleccionados.");}
function selectedIds(){var ids=selectedRows().map(function(row){return row.querySelector("[data-select-game]").dataset.selectGame;});if(!ids.length){adminFeedback("No hay IDs seleccionados.");return;}if(navigator.clipboard)navigator.clipboard.writeText(ids.join("\n")).then(function(){adminFeedback(ids.length+" IDs copiados.");}).catch(function(){adminFeedback("No se pudo copiar.");});}
function adminAction(action){
 if(action==="select"){selectVisible("all");adminFeedback("Se han marcado los juegos de la página visible.");return;}
 if(action==="invert"){selectVisible("invert");adminFeedback("Selección visible invertida.");return;}
 if(action==="clear"){clickExisting("bulkClear");adminFeedback("Selección limpiada.");return;}
 if(action==="csv"){csvExport();return;}if(action==="copy"){copyVisible();return;}
 if(action==="duplicates"||action==="empty"||action==="urls"){audit(action);return;}
 if(action==="report"){report();return;}
 if(action==="backup"){clickExisting("exportGames");if(!document.getElementById("exportGames"))clickExisting("dashboardExport");return;}
 if(action==="import"){clickExisting("importTrigger");return;}
 if(action==="publish"){clickExisting("bulkPublish");return;}if(action==="hide"){clickExisting("bulkHide");return;}
 if(action==="feature"){clickExisting("bulkFeature");return;}if(action==="unfeature"){clickExisting("bulkUnfeature");return;}
 if(action==="delete"){clickExisting("bulkDelete");return;}if(action==="refresh"){clickExisting("refreshCatalog");return;}
 if(action==="print"){window.print();return;}
 if(action==="selectedCsv"){selectedCsv();return;}if(action==="selectedIds"){selectedIds();return;}
 if(action==="stats"){var rows=adminRows(),selected=selectedCount(),pub=rows.filter(function(r){return /Publicado/.test(r.textContent);}).length;adminFeedback("Página: "+rows.length+" · Publicados: "+pub+" · Ocultos: "+(rows.length-pub)+" · Seleccionados: "+selected);return;}
 if(action==="categories"){var counts={};adminRows().forEach(function(r){var s=r.querySelector(".t small"),name=(s?s.textContent:"").split("·")[0].trim()||"Sin categoría";counts[name]=(counts[name]||0)+1;});adminFeedback(Object.keys(counts).map(function(k){return k+": "+counts[k];}).join(" · ")||"No hay categorías visibles.");return;}
 if(action==="published"||action==="hidden"){var select=document.getElementById("adminStatus");if(select){select.value=action;select.dispatchEvent(new Event("change",{bubbles:true}));}return;}
}
function decorate(){
 apply();
 var app=document.getElementById("app");if(!app)return;
 if(location.hash==="#admin"){addAdminTools(app);return;}
 if(location.hash.indexOf("#play/")===0)return;
 addVisitorTools(app);refreshSettingsButton();
}
document.addEventListener("click",function(e){
 var action=e.target.closest("[data-nova]");if(action){var a=action.dataset.nova;
 if(a==="settings")openSettings();
 if(a==="view"){prefs.view=prefs.view==="grid"?"list":"grid";save();apply();refreshSettingsButton();}
 if(a==="theme")toggleTheme();
 if(a==="export-favs")favoritesExport();
 if(a==="history")historyInfo();
 if(a==="print")window.print();if(a==="share")sharePage();if(a==="search")focusSearch();if(a==="random"){var r=document.getElementById("randomGame");if(r)r.click();}if(a==="favorites"){var fav=document.getElementById("favFilter");if(fav)fav.click();}if(a==="clear"){var clear=document.getElementById("clearFilters");if(clear)clear.click();}if(a==="reset"){prefs=Object.assign({},defaults);save();apply();refreshSettingsButton();toast("Preferencias restablecidas.");}
 }
 var adminActionButton=e.target.closest("[data-admin-tool]");if(adminActionButton)adminAction(adminActionButton.dataset.adminTool);
 var close=e.target.closest("[data-nova-close]");if(close){var d=document.getElementById("novaSettings");if(d&&d.open)d.close();}
 var reset=e.target.closest("[data-nova-reset]");if(reset){prefs=Object.assign({},defaults);save();apply();var dialog=document.getElementById("novaSettings");if(dialog&&dialog.open)dialog.close();openSettings();}
});
document.addEventListener("change",function(e){var key=e.target&&e.target.dataset&&e.target.dataset.pref;if(key&&Object.prototype.hasOwnProperty.call(defaults,key)){prefs[key]=e.target.value;save();apply();}});
document.addEventListener("keydown",function(e){
 if(e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==="/"&& !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();focusSearch();}
 if(e.key.toLowerCase()==="g"&&e.shiftKey){location.hash="";window.scrollTo({top:0,behavior:"smooth"});}
 if(e.key==="Escape"){var d=document.getElementById("novaSettings");if(d&&d.open)d.close();}
});
var observer=new MutationObserver(function(){decorate();});
var start=function(){decorate();var app=document.getElementById("app");if(app)observer.observe(app,{childList:true,subtree:true});window.addEventListener("hashchange",decorate);};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
apply();
})();