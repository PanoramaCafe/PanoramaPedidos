/* Panorama Café — catálogo y pedidos compartidos V1 · Supabase REST */
(function(){
  const cfg=window.PANORAMA_SUPABASE||{};
  const CATALOG_KEY='panorama_menu_catalog_v1', SETTINGS_KEY='panorama_menu_settings_v1', SESSION_KEY='panorama_supabase_session_v1';
  const embedded=JSON.parse(document.getElementById('panorama-initial-catalog')?.textContent||'[]');
  let loginInProgress=false;
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function localLoad(){try{const x=JSON.parse(localStorage.getItem(CATALOG_KEY)||'null');if(Array.isArray(x)&&x.length)return x}catch(e){}return clone(embedded)}
  function localSave(c){try{localStorage.setItem(CATALOG_KEY,JSON.stringify(c))}catch(e){}}
  function configured(){return !!(cfg.url&&cfg.key)}
  function base(){return String(cfg.url||'').replace(/\/$/,'')}
  function getStoredSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){return null}}
  function authHeaders(){const s=getStoredSession();return {'Content-Type':'application/json','apikey':cfg.key,'Authorization':'Bearer '+(s?.access_token||cfg.key)}}
  async function signIn(email,password){
    const r=await fetch(base()+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.key},body:JSON.stringify({email,password})});
    let body=null;try{body=await r.json()}catch(e){} if(!r.ok)throw new Error(body?.error_description||body?.msg||'No se pudo iniciar sesión.');
    localStorage.setItem(SESSION_KEY,JSON.stringify(body)); return body;
  }
  async function ensureStaffLogin(){
    if(getStoredSession()?.access_token||loginInProgress)return !!getStoredSession()?.access_token;
    loginInProgress=true;
    try{
      const email=window.prompt('Acceso de personal\nCorreo de Supabase:'); if(!email)return false;
      const password=window.prompt('Contraseña:'); if(!password)return false;
      await signIn(email.trim(),password); return true;
    }catch(e){alert(e.message||'No se pudo iniciar sesión.');return false}
    finally{loginInProgress=false}
  }
  async function rest(path,opts={},retry=true){
    const r=await fetch(base()+path,Object.assign({headers:authHeaders()},opts));
    let body=null;try{body=await r.json()}catch(e){}
    if(!r.ok){
      if(r.status===401&&retry){const ok=await ensureStaffLogin();if(ok)return rest(path,opts,false)}
      throw new Error(body?.message||body?.error_description||body?.hint||('Supabase respondió '+r.status));
    }
    return body;
  }
  async function load(){
    if(!configured())return localLoad();
    try{const rows=await rest('/rest/v1/panorama_pedidos_catalog?select=catalog&eq.id=1');const catalog=rows?.[0]?.catalog||[];if(catalog.length)localSave(catalog);return catalog}
    catch(e){return localLoad()}
  }
  async function loadStatic(){
    if(embedded.length)return clone(embedded);
    const prefix=location.pathname.includes('/admin/')||location.pathname.includes('/recepcion/')?'../data/':'data/'; const out=[];
    for(let i=0;i<9;i++){try{const r=await fetch(prefix+'cat-'+i+'.json');if(r.ok)out.push(await r.json())}catch(e){}} return out;
  }
  async function save(catalog){
    if(!configured())throw new Error('Supabase no está configurado.');
    await rest('/rest/v1/panorama_pedidos_catalog?id=eq.1',{method:'PATCH',headers:Object.assign({},authHeaders(),{'Prefer':'return=minimal'}),body:JSON.stringify({schema_version:1,catalog:clone(catalog),updated_at:new Date().toISOString(),updated_by:'admin-web'})});
    localSave(catalog); return {mode:'supabase',catalog:clone(catalog)};
  }
  function subscribeCatalog(cb){
    if(!configured())return()=>{}; let last='';
    const tick=async()=>{try{const rows=await rest('/rest/v1/panorama_pedidos_catalog?select=catalog&eq.id=1');const c=rows?.[0]?.catalog||[];const raw=JSON.stringify(c);if(c.length&&raw!==last){last=raw;localSave(c);cb(clone(c))}}catch(e){}};
    tick(); const id=setInterval(tick,3000); return()=>clearInterval(id);
  }
  async function saveOrder(order){
    if(!configured())throw new Error('Supabase no está configurado.');
    await rest('/rest/v1/panorama_pedidos_orders',{method:'POST',headers:Object.assign({},authHeaders(),{'Prefer':'return=minimal'}),body:JSON.stringify({order_id:order.orderId,status:'pending_confirmation',payload:clone(order),created_at:order.createdAt||new Date().toISOString(),status_updated_at:new Date().toISOString()})});
    return {mode:'supabase'};
  }
  function mapOrder(row){const p=row?.payload||{};return Object.assign({},p,{orderId:row.order_id,status:row.status,createdAt:row.created_at,statusUpdatedAt:row.status_updated_at})}
  async function loadOrders(){const rows=await rest('/rest/v1/panorama_pedidos_orders?select=*&order=created_at.desc');return(rows||[]).map(mapOrder)}
  function subscribeOrders(cb){
    if(!configured())return()=>{}; let stopped=false;
    const tick=async()=>{try{const rows=await loadOrders();if(!stopped)cb(rows)}catch(e){if(!stopped&&e.message)console.warn(e.message)}};
    tick(); const id=setInterval(tick,2500); return()=>{stopped=true;clearInterval(id)};
  }
  async function updateOrderStatus(orderId,status,extra={}){await rest('/rest/v1/panorama_pedidos_orders?order_id=eq.'+encodeURIComponent(orderId),{method:'PATCH',headers:Object.assign({},authHeaders(),{'Prefer':'return=minimal'}),body:JSON.stringify(Object.assign({status,status_updated_at:new Date().toISOString()},extra))})}
  async function signOut(){localStorage.removeItem(SESSION_KEY);location.reload()}
  function session(){return getStoredSession()}
  function getSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}catch(e){return{}}}
  function saveSettings(s){localStorage.setItem(SETTINGS_KEY,JSON.stringify(s||{}));return getSettings()}
  window.PanoramaCatalog={initial:embedded,load,loadStatic,save,reset:()=>{localStorage.removeItem(CATALOG_KEY);return localLoad()},clone,remoteConfigured:configured,subscribeCatalog,saveOrder,subscribeOrders,updateOrderStatus,getSettings,saveSettings,signIn,signOut,session,CATALOG_KEY,SETTINGS_KEY};
})();
