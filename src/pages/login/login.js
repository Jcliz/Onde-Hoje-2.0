const email = document.getElementById('email').value.trim();
const senha = document.getElementById('password').value.trim();

async function loginUsuario() {
  //atualização dos dados
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
      alert('Login bem-sucedido!');
      window.location.href = '/topRoles/topRoles';
    } else {
      const errorData = await response.json();
      alert(errorData.message || 'Erro ao realizar login.');
    }
    
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao tentar logar. Tente novamente.');
  }
}

function enviarDados() {
  loginUsuario();
}


document.addEventListener('DOMContentLoaded', function () {
  var inputs = document.querySelectorAll('.form-control');

  inputs.forEach(function (input) {
    var label = input.previousElementSibling;

    input.addEventListener('focus', function () {
      input.classList.add('active');
      label.classList.add('active');
    });

    input.addEventListener('blur', function () {
      if (input.value.trim() === '') {
        input.classList.remove('active');
        label.classList.remove('active');
      }
    });

    if (input.value.trim() !== '') {
      input.classList.add('active');
      label.classList.add('active');
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  var inputs = document.querySelectorAll('.password-form');

  inputs.forEach(function (input) {
    var label = input.previousElementSibling;

    input.addEventListener('focus', function () {
      input.classList.add('active');
      label.classList.add('active');
    });

    input.addEventListener('blur', function () {
      if (input.value.trim() === '') {
        input.classList.remove('active');
        label.classList.remove('active');
      }
    });

    if (input.value.trim() !== '') {
      input.classList.add('active');
      label.classList.add('active');
    }
  });
});

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