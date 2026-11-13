# Receptor del form (Apps Script → Gmail)

El form ya no manda las respuestas a n8n. Las manda a un Apps Script en tu cuenta de Google, que te las reenvía por correo con el asunto `[AZXION-ONBOARDING] <negocio> — <nombre>`. Una rutina de Claude revisa esos correos cada hora y crea un Google Doc por cliente.

## Instalación (una sola vez, ~5 min)

1. Entra a https://script.google.com con la cuenta de Gmail donde quieres recibir los forms y crea un **Proyecto nuevo**.
2. Borra lo que trae y pega el contenido de `Code.gs`. Guarda.
3. **Implementar → Nueva implementación** → tipo **Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
4. Autoriza los permisos que pide (enviar correo como tú).
5. Copia la **URL de la aplicación web** (termina en `/exec`) y pégala en `FORM_WEBHOOK_URL` dentro de `app.js`.

Si después cambias `Code.gs`, usa **Implementar → Gestionar implementaciones → Editar → Versión nueva** para que la URL siga siendo la misma.
