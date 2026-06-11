/* ===== AZXION ONBOARDING ===== */

// ---- Config ----
// Links de Loom en formato EMBED: https://www.loom.com/embed/<id>
// (si un link queda vacío, se muestra un placeholder de "video en preparación")
const VIDEO_BIENVENIDA_URL = 'https://www.loom.com/embed/dabef44bcc014669992e9aa1d503c256';
const VIDEO_PROXIMOS_PASOS_URL = 'https://www.loom.com/embed/bf6578094e3d4f13a33168f26b393b5a';

// Opcional: webhook (n8n, Make, etc.) para recibir las respuestas del form como JSON
const FORM_WEBHOOK_URL = '';

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
function handleFormSubmit(event) {
  event.preventDefault();
  const form = document.getElementById('onboardingForm');
  const error = document.getElementById('formError');

  form.querySelectorAll('.form-input').forEach(i => i.classList.remove('input-invalid'));

  if (!form.checkValidity()) {
    let firstInvalid = null;
    form.querySelectorAll(':invalid').forEach(field => {
      field.classList.add('input-invalid');
      if (!firstInvalid) firstInvalid = field;
    });
    error.textContent = 'Faltan campos obligatorios por completar. Revisa los campos marcados.';
    error.hidden = false;
    if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  error.hidden = true;

  const data = Object.fromEntries(new FormData(form).entries());
  data.fecha_envio = new Date().toISOString();
  localStorage.setItem('azxion_form_data', JSON.stringify(data));

  if (FORM_WEBHOOK_URL) {
    fetch(FORM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(err => console.error('Error enviando form al webhook:', err));
  }

  formCompleted = true;
  localStorage.setItem('azxion_form_completed', 'true');
  localStorage.removeItem(FORM_DRAFT_KEY);
  showStep(3);
}

// ---- Init ----
loadVideos();
restoreDraft();
const onboardingForm = document.getElementById('onboardingForm');
onboardingForm.addEventListener('submit', handleFormSubmit);
onboardingForm.addEventListener('input', saveDraft);
showStep(1);
