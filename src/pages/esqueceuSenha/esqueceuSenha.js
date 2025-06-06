import { showToast } from "../../../components/toast.js";

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

async function verificarEmail() {
  const email = document.getElementById('email').value.trim();

  try {
    const response = await fetch('/api/esqueceuSenha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      const data = await response.json();
      showToast('E-mail enviado!', 'success');
      window.location.href = '../retorno/retornoHome.html';
    } else {
      const errorData = await response.json();
      showToast('E-mail não encontrado.', 'error');
    }
  
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao tentar recuperar a senha. Tente novamente.', 'error');
  }
}

function enviarDados(event) {
  event.preventDefault(); 
  verificarEmail();
  return false; 
}
