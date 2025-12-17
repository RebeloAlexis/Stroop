/**
 * Animation "magic focus" : highlight du champ actif
 */
class MagicFocus {
  constructor(parent) {
    if (!parent) return;

    this.parent = parent;
    this.focusEl = parent.querySelector('.magic-focus');

    const inputs = parent.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => this.show(input));
      input.addEventListener('blur', () => this.hide());
    });
  }

  show(el) {
    clearTimeout(this.timeout);

    let top = 0;
    let left = 0;
    let current = el;

    while (current && current !== this.parent) {
      top += current.offsetTop;
      left += current.offsetLeft;
      current = current.offsetParent;
    }

    this.focusEl.style.top = top + 'px';
    this.focusEl.style.left = left + 'px';
    this.focusEl.style.width = el.offsetWidth + 'px';
    this.focusEl.style.height = el.offsetHeight + 'px';
  }

  hide() {
    this.focusEl.style.width = 0;

    this.timeout = setTimeout(() => {
      this.focusEl.removeAttribute("style");
    }, 200);
  }
}

/**
 * Génération d'un ID participant court et unique
 */
function generateParticipantId() {
  return 'P-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#pretest-form');
  new MagicFocus(form);

  // --- Gestion du champ "autre type" de daltonisme ---
  const colorblindSelect = document.getElementById('colorblind');
  const colorblindOtherWrapper = document.getElementById('colorblind-other-wrapper');
  const colorblindOtherInput = document.getElementById('colorblind-other');

  function updateColorblindOther() {
    if (colorblindSelect.value === 'autre') {
      colorblindOtherWrapper.style.display = '';
      colorblindOtherInput.required = true;
    } else {
      colorblindOtherWrapper.style.display = 'none';
      colorblindOtherInput.required = false;
      colorblindOtherInput.value = '';
    }
  }

  updateColorblindOther();
  colorblindSelect.addEventListener('change', updateColorblindOther);

  // --- Soumission du formulaire ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const consent = document.getElementById('consent').checked;
    if (!consent) {
      alert("Vous devez cocher la case de consentement pour commencer l'expérience.");
      return;
    }

    // 🔹 ID participant
    const participant = generateParticipantId();

    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const laterality = document.getElementById('laterality').value;
    const colorblind = document.getElementById('colorblind').value;
    const colorblindOther = document.getElementById('colorblind-other').value || null;
    const mouse = document.getElementById('mouse').value;

    const userData = {
      participant,
      age,
      gender,
      laterality,
      colorblind,
      colorblindOther,
      mouse,
      consent
    };

    // Stockage local
    localStorage.setItem('stroopUserData', JSON.stringify(userData));

    // Redirection vers l'expérience
    window.location.href = 'test1.html';
  });
});
