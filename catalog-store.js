/* Panorama Café — catálogo compartido V1
 * Fuente inicial: menú PDF 2026.
 * Prototipo: guarda cambios en localStorage del navegador.
 * Futuro: sustituir/adaptar este almacenamiento a Supabase sin cambiar el modelo.
 */
(function(){
  const KEY='panorama_menu_catalog_v1';
  const SETTINGS_KEY='panorama_menu_settings_v1';
  const initial=JSON.parse(document.getElementById('panorama-initial-catalog')?.textContent || '[]');
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function load(){try{const raw=localStorage.getItem(KEY);if(raw)return JSON.parse(raw)}catch(e){}return clone(initial)}
  function save(catalog){localStorage.setItem(KEY,JSON.stringify(catalog));return load()}
  function reset(){localStorage.removeItem(KEY);return load()}
  function exportJSON(){return JSON.stringify(load(),null,2)}
  function importJSON(text){const data=JSON.parse(text);if(!Array.isArray(data))throw new Error('El catálogo debe ser un arreglo de categorías.');save(data);return data}
  function getSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}catch(e){return {}}}
  function saveSettings(s){localStorage.setItem(SETTINGS_KEY,JSON.stringify(s||{}));return getSettings()}
  window.PanoramaCatalog={KEY,SETTINGS_KEY,initial,load,save,reset,exportJSON,importJSON,getSettings,saveSettings,clone};
})();