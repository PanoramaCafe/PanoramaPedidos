/* Panorama Café — catálogo y pedidos compartidos V1 · Supabase */
(function(){
  const cfg=window.PANORAMA_SUPABASE||{};
  const CATALOG_KEY='panorama_menu_catalog_v1', SETTINGS_KEY='panorama_menu_settings_v1';
  const embedded=JSON.parse(document.getElementById('panorama-initial-catalog')?.textContent||'[]');
  let client=null;
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function localLoad(){try{const x=JSON.parse(localStorage.getItem(CATALOG_KEY)||'null');if(Array.isArray(x)&&x.length)return x}catch(e){}return clone(embedded)}
  function localSave(c){try{localStorage.setItem(CATALOG_KEY,JSON.stringify(c))}catch(e){}}
  function configured(){return !!(window.supabase&&cfg.url&&cfg.key)}
  function getClient(){if(!client&&configured())client=window.supabase.createClient(cfg.url,cfg.key);return client}
  async function load(){
    const c=getClient();
    if(!c)return localLoad();
    const {data,error}=await c.from('panorama_pedidos_catalog').select('catalog').eq('id',1).maybeSingle();
    if(error)throw error;
    const catalog=data?.catalog||[]; localSave(catalog); return catalog;
  }
  async function loadStatic(){
    if(embedded.length)return clone(embedded);
    const prefix=location.pathname.includes('/admin/')||location.pathname.includes('/recepcion/')?'../data/':'data/';
    const out=[]; for(let i=0;i<9;i++){try{const r=await fetch(prefix+'cat-'+i+'.json');if(r.ok)out.push(await r.json())}catch(e){}}
    return out;
  }
  async function save(catalog){
    const c=getClient(); if(!c)throw new Error('Supabase no está configurado.');
    const {error}=await c.from('panorama_pedidos_catalog').upsert({id:1,schema_version:1,catalog:clone(catalog),updated_at:new Date().toISOString(),updated_by:'admin-web'},{onConflict:'id'});
    if(error)throw error; localSave(catalog); return {mode:'supabase',catalog:clone(catalog)};
  }
  function subscribeCatalog(cb){
    const c=getClient(); if(!c)return()=>{};
    const ch=c.channel('panorama-catalog').on('postgres_changes',{event:'*',schema:'public',table:'panorama_pedidos_catalog'},p=>{if(p.new?.catalog){localSave(p.new.catalog);cb(clone(p.new.catalog))}}).subscribe();
    return()=>c.removeChannel(ch);
  }
  async function saveOrder(order){
    const c=getClient(); if(!c)throw new Error('Supabase no está configurado.');
    const {error}=await c.from('panorama_pedidos_orders').insert({order_id:order.orderId,status:'pending_confirmation',payload:clone(order),created_at:order.createdAt||new Date().toISOString(),status_updated_at:new Date().toISOString()});
    if(error)throw error; return {mode:'supabase'};
  }
  function mapOrder(row){const p=row?.payload||{};return Object.assign({},p,{orderId:row.order_id,status:row.status,createdAt:row.created_at,statusUpdatedAt:row.status_updated_at})}
  async function loadOrders(){
    const c=getClient(); if(!c)throw new Error('Supabase no está configurado.');
    const {data,error}=await c.from('panorama_pedidos_orders').select('*').order('created_at',{ascending:false});
    if(error)throw error; return (data||[]).map(mapOrder);
  }
  function subscribeOrders(cb){
    const c=getClient(); if(!c)return()=>{};
    loadOrders().then(cb).catch(()=>{});
    const ch=c.channel('panorama-orders').on('postgres_changes',{event:'*',schema:'public',table:'panorama_pedidos_orders'},()=>loadOrders().then(cb).catch(()=>{})).subscribe();
    return()=>c.removeChannel(ch);
  }
  async function updateOrderStatus(orderId,status,extra={}){
    const c=getClient(); if(!c)throw new Error('Supabase no está configurado.');
    const {error}=await c.from('panorama_pedidos_orders').update(Object.assign({status,status_updated_at:new Date().toISOString()},extra)).eq('order_id',orderId);
    if(error)throw error;
  }
  async function signIn(email,password){const {data,error}=await getClient().auth.signInWithPassword({email,password});if(error)throw error;return data.session}
  async function signOut(){return getClient().auth.signOut()}
  async function session(){const {data}=await getClient().auth.getSession();return data.session}
  function getSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}catch(e){return{}}}
  function saveSettings(s){localStorage.setItem(SETTINGS_KEY,JSON.stringify(s||{}));return getSettings()}
  window.PanoramaCatalog={initial:embedded,load,loadStatic,save,reset:()=>{localStorage.removeItem(CATALOG_KEY);return localLoad()},clone,remoteConfigured:configured,subscribeCatalog,saveOrder,subscribeOrders,updateOrderStatus,getSettings,saveSettings,signIn,signOut,session,CATALOG_KEY,SETTINGS_KEY};
})();
