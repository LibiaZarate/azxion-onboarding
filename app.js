/* ===== AZXION ONBOARDING ===== */

// ---- Config ----
// Links de Loom en formato EMBED: https://www.loom.com/embed/<id>
// (si un link queda vacío, se muestra un placeholder de "video en preparación")
const VIDEO_BIENVENIDA_URL = 'https://www.loom.com/embed/dabef44bcc014669992e9aa1d503c256';
const VIDEO_PROXIMOS_PASOS_URL = 'https://www.loom.com/embed/bf6578094e3d4f13a33168f26b393b5a';

// Opcional: webhook (n8n, Make, etc.) para recibir las respuestas del form como JSON
const FORM_WEBHOOK_URL = 'https://n8n-azxion.slmipf.easypanel.host/webhook/33413fba-fb99-4bde-90bc-a55a545dc6db';

let currentStep = 1;
const totalSteps = 3;
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
      wrapper.innerHTML = '<div class="video-pending">[ VIDEO_EN_PREPARACIÓN ]</div>';
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
    btn.innerHTML = '<span class="sent-check">✓</span> FORM_ENVIADO';
  } else if (state === 'retry') {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-bracket">[</span> REINTENTAR_ENVÍO <span class="btn-bracket">]</span> <span class="btn-arrow">→</span>';
  } else {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-bracket">[</span> ENVIAR_FORM <span class="btn-bracket">]</span> <span class="btn-arrow">→</span>';
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

  if (FORM_WEBHOOK_URL) {
    setSubmitButton('sending');
    try {
      const res = await fetch(FORM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } catch (err) {
      console.error('Error enviando form al webhook:', err);
      setSubmitButton('retry');
      error.innerHTML = '<span class="list-prefix">!</span> No pudimos enviar tus respuestas (error de conexión). No te preocupes: están guardadas en este navegador. Intenta de nuevo en unos segundos.';
      error.hidden = false;
      error.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
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

// ---- Init ----
loadVideos();
restoreDraft();
const onboardingForm = document.getElementById('onboardingForm');
onboardingForm.addEventListener('submit', handleFormSubmit);
onboardingForm.addEventListener('input', (e) => {
  saveDraft();
  if (e.target.classList && e.target.classList.contains('form-input')) clearFieldError(e.target);
});
showStep(1);
