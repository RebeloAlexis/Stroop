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
  
    // --- Validation + redirection ---
    form.addEventListener('submit', (e) => {
      e.preventDefault(); // on bloque la soumission normale
  
      const consent = document.querySelector('#consent');
      if (!consent.checked) {
        alert("Vous devez cocher la case de consentement pour commencer l'expérience.");
        return;
      }

      // Récupérer les informations utiles
      var age = document.getElementById('age');
      console.log(age);

      // Si tout est OK → redirection vers index.html
      window.location.href = "test1.html";
    });
  });

  document.getElementById("pretest-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const age = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const laterality = document.getElementById("laterality").value;
    const colorblind = document.getElementById("colorblind").value;
    const colorblindOther = document.getElementById("colorblind-other").value || null;
    const mouse = document.getElementById("mouse").value;
    const consent = document.getElementById("consent").checked;

    // Stocker dans localStorage
    const userData = {
        age,
        gender,
        laterality,
        colorblind,
        colorblindOther,
        mouse,
        consent
    };

    localStorage.setItem("stroopUserData", JSON.stringify(userData));

    // Redirection vers la page de l'expérience
    window.location.href = "index.html";
});
