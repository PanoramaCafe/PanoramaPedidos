# WhatsApp — Panorama Café

La integración ya está conectada a la app de recepción mediante la Edge Function `notify-whatsapp`.

## Falta configurar en Supabase

Crear estos Secrets en **Supabase → Edge Functions → Secrets**:

- `WHATSAPP_ACCESS_TOKEN` — token de acceso de Meta/WhatsApp Cloud API.
- `WHATSAPP_PHONE_NUMBER_ID` — ID del número de WhatsApp Business que enviará los mensajes.
- `WHATSAPP_TEMPLATE_NAME` — opcional; por defecto `panorama_pedido_actualizacion`.
- `WHATSAPP_TEMPLATE_LANGUAGE` — opcional; por defecto `es_MX`.
- `WHATSAPP_GRAPH_VERSION` — opcional; por defecto `v23.0`.

No poner estos secretos en GitHub, `firebase-config.js`, HTML ni JavaScript del navegador.

## Plantilla recomendada

Crear en WhatsApp Manager una plantilla de utilidad, por ejemplo:

`panorama_pedido_actualizacion`

Texto sugerido:

> Hola {{1}}, tu pedido {{2}} está {{3}}. Consulta su seguimiento aquí: {{4}}

Variables:

1. Nombre del cliente
2. Número de pedido
3. Estado actual
4. Enlace privado de seguimiento

## Estados que disparan aviso

- Confirmado
- En preparación
- Listo para entregar
- Completado
- Cancelado

El sistema no bloquea el cambio de estado si WhatsApp está desconectado. El seguimiento web continúa funcionando.
