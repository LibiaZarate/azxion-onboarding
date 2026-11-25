/* ===== AZXION ONBOARDING ===== */

// ---- Config ----
// Links de Loom en formato EMBED: https://www.loom.com/embed/<id>
// (si un link queda vacío, se muestra un placeholder de "video en preparación")
const VIDEO_BIENVENIDA_URL = 'https://www.loom.com/embed/dabef44bcc014669992e9aa1d503c256';
const VIDEO_PROXIMOS_PASOS_URL = 'https://www.loom.com/embed/bf6578094e3d4f13a33168f26b393b5a';

// URL del Apps Script (Implementar > Aplicación web) que recibe las respuestas
// y las manda a tu Gmail. Ver apps-script/README.md
const FORM_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwB-dkD72Ha1OR2MxkguPsM3oIsNTcQdYnG6-L5n6qawchN_QnbK-cRAwWp6vIRTYk/exec';

// Supabase (proyecto Proceso Comercial): solo puede INSERTAR, nunca leer.
const SUPABASE_URL = 'https://zzigctajijhaedovznhe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_RzWF6nBKQQcI6mhHGvrTUA_Sps1ct08';

function nuevaSesion() {
  const id = (crypto.randomUUID && crypto.randomUUID()) || 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16));
  try { localStorage.setItem('azxion_sesion', id); } catch (e) {}
  return id;
}
let SESION_ID;
try { SESION_ID = localStorage.getItem('azxion_sesion') || nuevaSesion(); } catch (e) { SESION_ID = nuevaSesion(); }

async function sbInsert(tabla, fila) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + tabla, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(fila)
  });
  if (!res.ok) throw new Error('Supabase ' + res.status);
}

// Registra en qué paso va cada cliente. Nunca bloquea la página si falla.
function track(evento, paso, datos) {
  sbInsert('onboarding_eventos', { sesion_id: SESION_ID, evento, paso: paso || currentStep, datos: datos || {} })
    .catch(err => console.warn('track', evento, err));
}

let currentStep = 1;
const totalSteps = 7;
let formCompleted = localStorage.getItem('azxion_form_completed') === 'true';

// ---- Videos ----
function loadVideos() {
  document.querySelectorAll('.video-wrapper[data-video]').forEach(wrapper => {
    const url = wrapper.dataset.video === 'bienvenida' ? VIDEO_BIENVENIDA_URL : VIDEO_PROXIMOS_PASOS_URL;
    if (url) {
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', '');
      iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
      wrapper.appendChild(iframe);
    } else {
      wrapper.innerHTML = '<div class="video-pending">[ VIDEO EN PREPARACIÓN ]</div>';
    }
  });
}

// ---- Step Navigation ----
function goToStep(step) {
  if (step < 1 || step > totalSteps) return;

  // El paso 3 solo se desbloquea completando el form
  if (step === 3 && !formCompleted) {
    const error = document.getElementById('formError');
    error.textContent = 'Tienes que completar y enviar el form para continuar.';
    error.hidden = false;
    if (currentStep !== 2) showStep(2);
    return;
  }

  showStep(step);
}

function showStep(step) {
  document.querySelectorAll('.step-panel').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });

  const target = document.getElementById('step' + step);
  if (target) {
    target.style.display = 'block';
    void target.offsetWidth;
    target.classList.add('active');
  }

  document.querySelectorAll('.progress-step').forEach(s => {
    const sNum = parseInt(s.dataset.step);
    s.classList.remove('active', 'completed');
    if (sNum === step) s.classList.add('active');
    else if (sNum < step) s.classList.add('completed');
  });

  document.getElementById('progressFill').style.width = ((step / totalSteps) * 100) + '%';
  currentStep = step;
  track('paso_visto', step);

  if (step === 3 && formCompleted) {
    document.getElementById('sentConfirm').hidden = false;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Form draft (autoguardado en el navegador) ----
const FORM_DRAFT_KEY = 'azxion_form_draft';

function saveDraft() {
  const form = document.getElementById('onboardingForm');
  const data = Object.fromEntries(new FormData(form).entries());
  localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(data));
}

function restoreDraft() {
  let draft;
  try {
    draft = JSON.parse(localStorage.getItem(FORM_DRAFT_KEY) || 'null');
  } catch (e) {
    return;
  }
  if (!draft) return;
  const form = document.getElementById('onboardingForm');
  Object.entries(draft).forEach(([name, value]) => {
    const field = form.elements[name];
    if (field && !(field instanceof RadioNodeList)) field.value = value;
  });
}

// ---- Form ----
function setSubmitButton(state) {
  const btn = document.getElementById('submitFormBtn');
  if (state === 'sending') {
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-bracket">[</span> ENVIANDO... <span class="btn-bracket">]</span>';
  } else if (state === 'sent') {
    btn.disabled = true;
    btn.innerHTML = '<span class="sent-check">✓</span> ENVIADO';
  } else if (state === 'retry') {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-bracket">[</span> REINTENTAR <span class="btn-bracket">]</span> <span class="btn-arrow">→</span>';
  } else {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-bracket">[</span> ENVIAR <span class="btn-bracket">]</span> <span class="btn-arrow">→</span>';
  }
}

function clearFieldError(field) {
  field.classList.remove('input-invalid');
  const group = field.closest('.form-group');
  if (group) {
    const msg = group.querySelector('.field-error');
    if (msg) msg.remove();
  }
}

function markFieldInvalid(field) {
  field.classList.add('input-invalid');
  const group = field.closest('.form-group');
  if (group && !group.querySelector('.field-error')) {
    const msg = document.createElement('p');
    msg.className = 'field-error';
    msg.textContent = '✗ Esta respuesta es obligatoria — es parte de lo que se nos envía. Llénala bien.';
    group.appendChild(msg);
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const form = document.getElementById('onboardingForm');
  const error = document.getElementById('formError');
  const sent = document.getElementById('formSent');

  form.querySelectorAll('.form-input').forEach(clearFieldError);

  if (!form.checkValidity()) {
    let firstInvalid = null;
    form.querySelectorAll(':invalid').forEach(field => {
      markFieldInvalid(field);
      if (!firstInvalid) firstInvalid = field;
    });
    error.innerHTML = '<span class="list-prefix">!</span> Faltan respuestas obligatorias — están marcadas en rojo. Solo el link de Loom del final es opcional.';
    error.hidden = false;
    if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  error.hidden = true;

  const data = Object.fromEntries(new FormData(form).entries());
  data.fecha_envio = new Date().toISOString();
  localStorage.setItem('azxion_form_data', JSON.stringify(data));

  setSubmitButton('sending');
  try {
    // 1) Guardar en Supabase (lo que queda); 2) avisar a Gmail como antes
    await sbInsert('onboarding_respuestas', { sesion_id: SESION_ID, nombre: data.nombre, email: data.email, telefono: data.telefono, negocio: data.negocio, respuestas: data });
    track('form_enviado', 2);
    if (!FORM_WEBHOOK_URL) throw new Error('FORM_WEBHOOK_URL sin configurar');
    // text/plain evita el preflight CORS, que Apps Script no responde
    const res = await fetch(FORM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const result = await res.json();
    if (!result.ok) throw new Error('Apps Script: ' + result.error);
  } catch (err) {
    console.error('Error enviando form:', err);
    setSubmitButton('retry');
    error.innerHTML = '<span class="list-prefix">!</span> No pudimos enviar tus respuestas (error de conexión). No te preocupes: están guardadas en este navegador. Intenta de nuevo en unos segundos.';
    error.hidden = false;
    error.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Envío confirmado
  setSubmitButton('sent');
  sent.hidden = false;
  sent.scrollIntoView({ behavior: 'smooth', block: 'center' });

  formCompleted = true;
  localStorage.setItem('azxion_form_completed', 'true');
  localStorage.removeItem(FORM_DRAFT_KEY);

  setTimeout(() => showStep(3), 1600);
}

// ---- Pasos 4 a 7: herramientas, Zernio, sistema, acceso ----
function leerLocal(clave, def) {
  try { return JSON.parse(localStorage.getItem(clave) || 'null') || def; } catch (e) { return def; }
}
function guardarLocal(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {}
}

function guardarHerramientas() {
  const prefs = leerLocal('azxion_prefs', {});
  prefs.ia = document.getElementById('fIaElegida').value;
  guardarLocal('azxion_prefs', prefs);
  track('herramientas_guardadas', 4, { ia: prefs.ia });
  goToStep(5);
}

function guardarAcceso() {
  const prefs = leerLocal('azxion_prefs', {});
  prefs.github_usuario = document.getElementById('fGithubUser').value.trim().replace(/^@/, '');
  prefs.repo = document.getElementById('fRepo').value.trim() || 'mi-sistema';
  guardarLocal('azxion_prefs', prefs);
  const dados = [...document.querySelectorAll('.acceso-check:checked')].map(el => el.dataset.acceso);
  track('acceso_confirmado', 5, { github_usuario: prefs.github_usuario, repo: prefs.repo, plataformas: dados });
  goToStep(6);
}

function elegirWhatsapp(opcion) {
  track(opcion, 6);
  const p = document.getElementById('whatsappElegido');
  p.textContent = opcion === 'whatsapp_en_llamada'
    ? '✓ Anotado: conectamos tu WhatsApp juntos en la llamada.'
    : '✓ Perfecto: tu WhatsApp ya está conectado.';
  p.hidden = false;
}

function pedirConstruccion() {
  const prefs = leerLocal('azxion_prefs', {});
  prefs.vista = document.getElementById('fVista').value;
  prefs.bi = document.getElementById('fBi').value;
  prefs.deseo = document.getElementById('fDeseo').value.trim();
  guardarLocal('azxion_prefs', prefs);
  track('listo_para_construir', 7, prefs);
  document.getElementById('construccionPedida').hidden = false;
}

async function copiarTexto(id) {
  const t = document.getElementById(id).textContent;
  try { await navigator.clipboard.writeText(t); } catch (e) {}
}

// Videos paso a paso (mp4 propios)
function cargarVideosMp4() {
  document.querySelectorAll('.video-wrapper[data-video-mp4]').forEach(w => {
    const v = document.createElement('video');
    v.src = w.dataset.videoMp4;
    v.controls = true; v.preload = 'metadata'; v.playsInline = true;
    v.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#000;';
    v.addEventListener('play', () => track('video_play', currentStep, { video: w.dataset.videoMp4 }), { once: true });
    v.addEventListener('error', () => { w.innerHTML = '<div class="video-pending">[ VIDEO EN PREPARACIÓN ]</div>'; });
    w.appendChild(v);
  });
}

// ---- Init ----
loadVideos();
restoreDraft();
const onboardingForm = document.getElementById('onboardingForm');
onboardingForm.addEventListener('submit', handleFormSubmit);
onboardingForm.addEventListener('input', (e) => {
  saveDraft();
  if (e.target.classList && e.target.classList.contains('form-input')) clearFieldError(e.target);
});
document.querySelectorAll('[data-track]').forEach(el => el.addEventListener('click', () => track(el.dataset.track)));
document.querySelectorAll('.tool-check').forEach(el => el.addEventListener('change', () => { if (el.checked) track('cuenta_creada', 4, { herramienta: el.dataset.tool }); }));
document.querySelectorAll('.acceso-check').forEach(el => el.addEventListener('change', () => { if (el.checked) track('acceso_dado', 5, { plataforma: el.dataset.acceso }); }));
document.querySelectorAll('.copiable').forEach(el => el.addEventListener('click', async (e) => {
  e.preventDefault();
  try { await navigator.clipboard.writeText(el.dataset.copiar); el.classList.add('copiado'); setTimeout(() => el.classList.remove('copiado'), 1200); } catch (err) {}
}));
cargarVideosMp4();
showStep(formCompleted ? 3 : 1);
