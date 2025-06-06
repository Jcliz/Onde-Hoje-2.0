import { showToast } from "../../../components/toast.js";


const email = document.getElementById('email').value.trim();
const senha = document.getElementById('password').value.trim();

async function loginUsuario() {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('password').value.trim();

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, senha }),
    });

    if (response.ok) {
      const data = await response.json();
      showToast('Login bem-sucedido!', 'success');
      
      setTimeout(() => {
        window.location.href = '/src/pages/telaEntrada/telaentrada.html';
      }, 1500); 
    } else {
      const errorData = await response.json();
      showToast('Senha ou e-mail incorretos', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao tentar logar. Tente novamente.', 'error');
  }
}

document.querySelector('form').addEventListener('submit', function (event) {
  event.preventDefault();
  loginUsuario();
});

//alternar visibilidade da senha
document.querySelectorAll('.toggle-password').forEach(icon => {
  icon.addEventListener('click', function () {
    const targetId = this.getAttribute('data-target');
    const targetInput = document.getElementById(targetId);

    if (targetInput.type === 'password') {
      targetInput.type = 'text';
      this.querySelector('i').classList.remove('bi-eye-slash');
      this.querySelector('i').classList.add('bi-eye');
    } else {
      targetInput.type = 'password';
      this.querySelector('i').classList.remove('bi-eye');
      this.querySelector('i').classList.add('bi-eye-slash');
    }
  });
});

//validação de e-mail
function validarEmail(input) {
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (input.value.length < 5 || input.value.length > 50) {
    input.classList.add('is-invalid');
    return false;
  } else if (emailValid.test(input.value)) {
    input.classList.remove('is-invalid');
    return true;
  } else {
    input.classList.add('is-invalid');
    return false;
  }
}

document.getElementById('email').addEventListener('focusout', function () {
  validarEmail(this);
});

