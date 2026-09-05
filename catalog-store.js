/* Panorama Café — catálogo y pedidos compartidos V4 · Supabase REST */
(function(){
  const cfg=window.PANORAMA_SUPABASE||{}, CATALOG_KEY='panorama_menu_catalog_v1', SETTINGS_KEY='panorama_menu_settings_v1', SESSION_KEY='panorama_supabase_session_v1', TRACKING_KEY='panorama_order_tracking_v1';
  let loginInProgress=false,lastTrackingUrl='';
  const clone=x=>JSON.parse(JSON.stringify(x));
  function embedded(){try{const x=JSON.parse(document.getElementById('panorama-initial-catalog')?.textContent||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
  function localLoad(){try{const x=JSON.parse(localStorage.getItem(CATALOG_KEY)||'null');if(Array.isArray(x)&&x.length)return x}catch(e){}return embedded()}
  function localSave(x){try{localStorage.setItem(CATALOG_KEY,JSON.stringify(x))}catch(e){}}
  const configured=()=>!!(cfg.url&&cfg.key), base=()=>String(cfg.url||'').replace(/\/$/,'');
  function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){return null}}
  function headers(){const s=session();return{'Content-Type':'application/json','apikey':cfg.key,'Authorization':'Bearer '+(s?.access_token||cfg.key)}}
  async function signIn(email,password){const r=await fetch(base()+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.key},body:JSON.stringify({email,password})});let b=null;try{b=await r.json()}catch(e){}if(!r.ok)throw new Error(b?.error_description||b?.msg||'No se pudo iniciar sesión.');localStorage.setItem(SESSION_KEY,JSON.stringify(b));return b}
  async function ensureStaffLogin(){if(session()?.access_token)return true;if(loginInProgress)return false;loginInProgress=true;try{const email=prompt('Acceso de personal\nCorreo de Supabase:');if(!email)return false;const password=prompt('Contraseña:');if(!password)return false;await signIn(email.trim(),password);return true}catch(e){alert(e.message||'No se pudo iniciar sesión.');return false}finally{loginInProgress=false}}
  async function rest(path,opts={},retry=true){const r=await fetch(base()+path,Object.assign({headers:headers(),cache:'no-store'},opts));let b=null;try{b=await r.json()}catch(e){}if(!r.ok){if(r.status===401&&retry&&await ensureStaffLogin())return rest(path,opts,false);throw new Error(b?.message||b?.error_description||b?.hint||('Supabase respondió '+r.status))}return b}
  async function loadStatic(){const e=embedded();if(e.length)return clone(e);const prefix=location.pathname.includes('/admin/')||location.pathname.includes('/recepcion/')?'../data/':'data/';const out=[];for(let i=0;i<9;i++){try{const r=await fetch(prefix+'cat-'+i+'.json',{cache:'no-store'});if(r.ok){const x=await r.json();if(x?.items)out.push(x)}}catch(e){}}return out}
  async function load(){if(!configured())return loadStatic();try{const rows=await rest('/rest/v1/panorama_pedidos_catalog?select=catalog&eq.id=1');const c=rows?.[0]?.catalog||[];if(c.length){localSave(c);return c}}catch(e){}const c=localLoad();if(c.length)return c;return loadStatic()}
  async function save(catalog){if(!configured())throw Error('Supabase no está configurado.');await ensureStaffLogin();await rest('/rest/v1/panorama_pedidos_catalog?id=eq.1',{method:'PATCH',headers:Object.assign(headers(),{'Prefer':'return=minimal'}),body:JSON.stringify({schema_version:1,catalog:clone(catalog),updated_at:new Date().toISOString(),updated_by:'admin-web'})});localSave(catalog);return{mode:'supabase',catalog:clone(catalog)}}
  function subscribeCatalog(cb){if(!configured())return()=>{};let last='';const tick=async()=>{try{const rows=await rest('/rest/v1/panorama_pedidos_catalog?select=catalog&eq.id=1');const c=rows?.[0]?.catalog||[];const raw=JSON.stringify(c);if(c.length&&raw!==last){last=raw;localSave(c);cb(clone(c))}}catch(e){}};tick();const id=setInterval(tick,3000);return()=>clearInterval(id)}
  function makeTrackingToken(){try{return crypto.randomUUID().replaceAll('-','')}catch(e){return String(Date.now())+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)}}
  function trackingUrl(token){return 'https://panoramacafe.github.io/PanoramaPedidos/seguimiento/?token='+encodeURIComponent(token)}
  function rememberTracking(order){try{localStorage.setItem(TRACKING_KEY,JSON.stringify({orderId:order.orderId,token:order.trackingToken,url:order.trackingUrl,savedAt:new Date().toISOString()}))}catch(e){}}
  async function saveOrder(order){
    if(!configured())throw Error('Supabase no está configurado.');
    if(!order.trackingToken)order.trackingToken=makeTrackingToken();
    order.trackingUrl=trackingUrl(order.trackingToken);
    rememberTracking(order);lastTrackingUrl=order.trackingUrl;
    await rest('/rest/v1/panorama_pedidos_orders',{method:'POST',headers:Object.assign(headers(),{'Prefer':'return=minimal'}),body:JSON.stringify({order_id:order.orderId,status:'pending_confirmation',tracking_token:order.trackingToken,payload:clone(order),created_at:order.createdAt||new Date().toISOString(),status_updated_at:new Date().toISOString()})});
    return{mode:'supabase',trackingToken:order.trackingToken,trackingUrl:order.trackingUrl};
  }
  const mapOrder=row=>Object.assign({},row?.payload||{},{orderId:row.order_id,status:row.status,createdAt:row.created_at,statusUpdatedAt:row.status_updated_at,trackingToken:row.tracking_token||row?.payload?.trackingToken||null});
  async function loadOrders(){await ensureStaffLogin();const rows=await rest('/rest/v1/panorama_pedidos_orders?select=*&order=created_at.desc');return(rows||[]).map(mapOrder)}
  function subscribeOrders(cb){if(!configured())return()=>{};let stopped=false;const tick=async()=>{try{const rows=await loadOrders();if(!stopped)cb(rows)}catch(e){if(!stopped)console.warn(e.message)}};tick();const id=setInterval(tick,2500);return()=>{stopped=true;clearInterval(id)}}
  async function notifyWhatsApp(id,status){
    const s=session();if(!s?.access_token)return;
    try{const r=await fetch(base()+'/functions/v1/notify-whatsapp',{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.key,'Authorization':'Bearer '+s.access_token},body:JSON.stringify({orderId:id,status})});if(!r.ok){let b={};try{b=await r.json()}catch(e){}console.warn('WhatsApp:',b?.message||b?.error||('HTTP '+r.status));}else{const b=await r.json().catch(()=>({}));if(b?.sent===false)console.info('WhatsApp:',b.message||'No enviado.');}}catch(e){console.warn('WhatsApp:',e.message||e)}
  }
  async function updateOrderStatus(id,status,extra={}){await ensureStaffLogin();await rest('/rest/v1/panorama_pedidos_orders?order_id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:Object.assign(headers(),{'Prefer':'return=minimal'}),body:JSON.stringify(Object.assign({status,status_updated_at:new Date().toISOString()},extra))});await notifyWhatsApp(id,status)}
  function signOut(){localStorage.removeItem(SESSION_KEY);location.reload()}
  function getSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}catch(e){return{}}}
  function saveSettings(s){localStorage.setItem(SETTINGS_KEY,JSON.stringify(s||{}));return getSettings()}
  function installTrackingUi(){
    const sheet=document.getElementById('statusSheet');if(!sheet)return;
    const ensure=()=>{const foot=sheet.querySelector('.sheetfoot');if(!foot)return;let b=document.getElementById('trackOrderBtn');if(!b){b=document.createElement('button');b.id='trackOrderBtn';b.className='secondary';b.textContent='Ver seguimiento del pedido';foot.appendChild(b);}b.onclick=()=>{try{const saved=JSON.parse(localStorage.getItem(TRACKING_KEY)||'null');const url=lastTrackingUrl||saved?.url;if(url)location.href=url;else alert('No encontramos el enlace de seguimiento de este pedido.');}catch(e){}};};
    ensure();
    const obs=new MutationObserver(ensure);obs.observe(sheet,{attributes:true,attributeFilter:['style']});
  }
  window.PanoramaCatalog={initial:embedded(),load,loadStatic,save,reset:()=>{localStorage.removeItem(CATALOG_KEY);return localLoad()},clone,remoteConfigured:configured,subscribeCatalog,saveOrder,subscribeOrders,updateOrderStatus,getSettings,saveSettings,signIn,signOut,session,CATALOG_KEY,SETTINGS_KEY,TRACKING_KEY};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installTrackingUi);else installTrackingUi();
})();
