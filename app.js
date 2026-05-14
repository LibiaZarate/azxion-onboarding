/* ===== AZXION ONBOARDING - SIMPLIFIED ===== */

let currentStep = 1;
const totalSteps = 3;

// ---- Step Navigation ----
function goToStep(step) {
  if (step < 1 || step > totalSteps) return;

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

goToStep(1);
