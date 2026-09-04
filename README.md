# PanoramaPedidos

Primera versión funcional de **Panorama Café — Pedidos en línea**.

## App cliente

La página principal (`index.html`) contiene el catálogo del menú 2026, selección de variantes y personalizaciones, carrito, datos del cliente, opción **Para llevar / Comer aquí**, mesa por URL (`?mesa=7`), confirmación de mayoría de edad para productos con alcohol y generación del objeto de pedido preparado para la futura app receptora.

### Estado actual

- El catálogo comercial toma como referencia el menú PDF 2026.
- No hay integración con Loyverse todavía.
- Los pedidos de prueba se guardan en `localStorage` del dispositivo.
- La conexión real con una base de datos y con la futura app receptora queda pendiente.
- `catalog-store.js` es la capa preparada para migrar posteriormente el catálogo a un backend compartido.

## Probar con GitHub Pages

1. En GitHub abre **Settings → Pages**.
2. En **Build and deployment**, selecciona **Deploy from a branch**.
3. Selecciona la rama `main` y la carpeta `/ (root)`.
4. Guarda y espera a que GitHub publique el sitio.
5. La app quedará disponible en la URL de Pages de este repositorio.

También puedes probar una mesa usando una URL como `?mesa=7`.

## Estructura

- `index.html` — App Cliente.
- `catalog-store.js` — almacenamiento/capa de catálogo.
- `data/cat-0.json` … `data/cat-8.json` — catálogo normalizado por categorías para la siguiente etapa.
- `integracion-futura.txt` — notas de integración futura.

> Importante: esta versión ya sirve para probar la experiencia del cliente, pero todavía **no es producción multi-dispositivo**. Para que un pedido enviado desde el teléfono aparezca en una computadora del café necesitaremos conectar una base de datos/backend compartido y construir la app receptora.