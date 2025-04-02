
function validarEmail(input) {
    const emailError = input.nextElementSibling;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (input.value.length < 5 || input.value.length > 50) {
      input.classList.add('is-invalid');
      emailError.style.display = 'block';
      emailError.textContent = 'Por favor, insira um e-mail válido.';
    } else if (emailValid.test(input.value)) {
      input.classList.remove('is-invalid');
      emailError.style.display = 'none';
    } else {
      input.classList.add('is-invalid');
      emailError.style.display = 'block';
      emailError.textContent = 'Por favor, insira um e-mail válido (exemplo@dominio.com).';
    }
  }
  
  document.getElementById('email').addEventListener('focusout', function () {
    validarEmail(this);
  });