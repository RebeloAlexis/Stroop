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
        this.focusEl.removeAttribute('style');
      }, 200);
    }
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
  
    // Initialisation + écouteur
    if (colorblindSelect) {
      updateColorblindOther();
      colorblindSelect.addEventListener('change', updateColorblindOther);
    }
  
    // --- Vérification du consentement à l'envoi ---
    form.addEventListener('submit', (e) => {
      const consent = document.querySelector('#consent');
      if (!consent.checked) {
        e.preventDefault();
        alert('Vous devez cocher la case de consentement pour commencer l’expérience.');
      }
    });
  });
  