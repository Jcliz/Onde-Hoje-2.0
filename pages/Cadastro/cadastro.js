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

function processarLogin(event) {
  event.preventDefault();

  // Se a validação for bem-sucedida, chama a função enviarDados
  if (validarSenha()) {
    enviarDados();
  }
}

async function cadastrarUsuario(email, senha, status) {
  try {
    const response = await fetch('/api/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, senha, status }),
    });

    if (response.ok) {
      const data = await response.json();
      alert('Usuário cadastrado com sucesso!');
      window.location.href = '/TelaInicial/telainicial.html';
    } else {
      alert('Erro ao cadastrar o usuário.');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao enviar os dados. Tente novamente.');
  }
}

function enviarDados() {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  // Chamar a função cadastrarUsuario com os dados capturados
  cadastrarUsuario(email, senha, true);
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
  var senhaInputs = document.querySelectorAll('.password-field');

  senhaInputs.forEach(function (input) {
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
