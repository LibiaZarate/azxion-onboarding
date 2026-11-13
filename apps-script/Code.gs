/* ===== AZXION ONBOARDING - Receptor del form =====
 * Recibe las respuestas del form (POST con JSON) y las manda por correo
 * a la cuenta de Google dueña del script. Claude revisa esos correos y
 * crea el Google Doc de cada cliente.
 *
 * Instalación: ver apps-script/README.md
 */

// Prefijo del asunto: Claude busca los correos nuevos por este texto. No lo cambies.
const SUBJECT_PREFIX = '[AZXION-ONBOARDING]';
const MAX_BODY_CHARS = 200000;

function doPost(e) {
  try {
    const raw = e && e.postData ? e.postData.contents : '';
    if (!raw || raw.length > MAX_BODY_CHARS) return json_({ ok: false, error: 'payload' });

    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !data.nombre || !data.email) {
      return json_({ ok: false, error: 'campos' });
    }

    const subject = SUBJECT_PREFIX + ' ' + clean_(data.negocio) + ' — ' + clean_(data.nombre);
    const lines = Object.keys(data).map(k => k + ':\n' + String(data[k]) + '\n');
    const body =
      'Nuevo form de onboarding recibido.\n\n' +
      lines.join('\n') +
      '\n----- JSON -----\n' + JSON.stringify(data, null, 2) + '\n----- FIN JSON -----\n';

    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: subject,
      body: body,
      replyTo: String(data.email)
    });

    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'servidor' });
  }
}

function clean_(value) {
  return String(value || 'Sin dato').replace(/[\r\n]+/g, ' ').slice(0, 80);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
