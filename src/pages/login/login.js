function validarSenha() {
  console.log('chamou a validação');

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const senhaConfirm = document.getElementById('senhaConfirm').value;

  // Esconde os labels de erro antes de verificar
  document.getElementById('campoObrigatorio').style.display = 'none';
  document.getElementById('senhaTamanho').style.display = 'none';
  document.getElementById('senhaPadrao').style.display = 'none';

  // Verifica se os campos de email ou senha estão vazios
  if (!email || !senha || !senhaConfirm) {
    console.log('campos vazios');
    document.getElementById('campoObrigatorio').style.display = 'block';
    return false;
  }

  // Verifica o tamanho da senha
  if (senha.length < 8 || senha.length > 16) {
    console.log('tamanho da senha inválido');
    document.getElementById('senhaTamanho').style.display = 'block';
    return false;
  }

  // Verifica se a senha atende ao padrão (letra maiúscula e caractere especial)
  if (!senha.match(/[A-Z]/) || !senha.match(/[^A-Za-z0-9]/)) {
    console.log('senha não atende ao padrão');
    document.getElementById('senhaPadrao').style.display = 'block';
    return false;
  }

  // Verifica se a confirmação da senha é igual à senha
  if (senha.trim() !== senhaConfirm.trim()) {
    console.log('as senhas não coincidem');
    document.getElementById('senhaObrigatorio').style.display = 'block'; 
    return false;
}

  console.log('email: ' + email);
  console.log('senha: ' + senha);
  return true; // Retorna true se a validação for bem-sucedida
}

async function loginUsuario(email, senha) {
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
      window.location.href = '/TelaInicial/telainicial.html';
    } else {
      const errorData = await response.json();
      alert(errorData.message || 'Erro ao realizar login.'); // Mensagem de fallback
    }
    
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao tentar logar. Tente novamente.');
  }
}

function enviarDados() {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();

  console.log('Chamando loginUsuario com email:', email); // Log para verificar

  // Chama a função de login ao invés de cadastrar usuário
  loginUsuario(email, senha);
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
