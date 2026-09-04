/* Panorama Café — catálogo y pedidos compartidos V1 */
(function(){
  const CATALOG_KEY='panorama_menu_catalog_v1', SETTINGS_KEY='panorama_menu_settings_v1';
  const initial=JSON.parse(document.getElementById('panorama-initial-catalog')?.textContent||'[]');
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function configured(){return !!window.firebaseConfig&&firebaseConfig.apiKey&&firebaseConfig.apiKey!=='TU_API_KEY'&&firebaseConfig.databaseURL&&firebaseConfig.databaseURL.indexOf('TU_PROYECTO')===-1;}
  function base(){return String(firebaseConfig.databaseURL||'').replace(/\/$/,'');}
  async function rest(path,opts={}){const r=await fetch(base()+path+'.json',Object.assign({headers:{'Content-Type':'application/json'}},opts));if(!r.ok)throw new Error('Firebase respondió '+r.status);return r.status===204?null:r.json();}
  function localLoad(){try{const x=JSON.parse(localStorage.getItem(CATALOG_KEY)||'null');if(Array.isArray(x))return x}catch(e){}return clone(initial)}
  function localSave(c){localStorage.setItem(CATALOG_KEY,JSON.stringify(c));return c}
  async function load(){if(!configured())return localLoad();try{const x=await rest('/catalog');if(x?.categories)return x.categories;if(Array.isArray(x))return x}catch(e){}return localLoad()}
  async function save(catalog){localSave(catalog);if(!configured())return{mode:'local',catalog:clone(catalog)};await rest('/catalog',{method:'PUT',body:JSON.stringify({schemaVersion:1,updatedAt:new Date().toISOString(),categories:clone(catalog)})});return{mode:'firebase',catalog:clone(catalog)}}
  function subscribeCatalog(cb){if(!configured())return()=>{};let last='';const tick=async()=>{try{const x=await rest('/catalog');const raw=JSON.stringify(x);if(x?.categories&&raw!==last){last=raw;cb(x.categories)}}catch(e){}};tick();const id=setInterval(tick,3000);return()=>clearInterval(id)}
  async function saveOrder(order){if(!configured())throw new Error('Firebase aún no está configurado.');await rest('/orders/'+encodeURIComponent(order.orderId),{method:'PUT',body:JSON.stringify(clone(order))});return{mode:'firebase'}}
  function subscribeOrders(cb){if(!configured())return()=>{};let last='';const tick=async()=>{try{const x=await rest('/orders');const raw=JSON.stringify(x);if(raw!==last){last=raw;cb(Object.values(x||{}).sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')))}}catch(e){}};tick();const id=setInterval(tick,2000);return()=>clearInterval(id)}
  async function updateOrderStatus(id,status,extra={}){if(!configured())throw new Error('Firebase aún no está configurado.');await rest('/orders/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(Object.assign({status,statusUpdatedAt:new Date().toISOString()},extra))})}
  function reset(){localStorage.removeItem(CATALOG_KEY);return localLoad()}
  function getSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}catch(e){return{}}}
  function saveSettings(s){localStorage.setItem(SETTINGS_KEY,JSON.stringify(s||{}));return getSettings()}
  window.PanoramaCatalog={initial,load,save,reset,clone,remoteConfigured:configured,subscribeCatalog,saveOrder,subscribeOrders,updateOrderStatus,getSettings,saveSettings,CATALOG_KEY,SETTINGS_KEY};
})();
