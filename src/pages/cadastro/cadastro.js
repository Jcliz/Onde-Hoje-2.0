const cep = document.querySelector('#cep');
const rua = document.querySelector('#street');
const bairro = document.querySelector('#bairro');
const cidade = document.querySelector('#cidade');
const numero = document.querySelector('#number');
const mensagem = document.querySelector('.invalid-feedback');
const cpf = document.getElementById('cpf').value;
const nome = document.getElementById('name').value;

// // Remover a classe is-invalid e reposicionar o ícone ao carregar a página
// document.addEventListener('DOMContentLoaded', () => {
//   const senha = document.getElementById('password');
//   const senhaConfirm = document.getElementById('confirmPassword');
//   senha.classList.remove('is-invalid');
//   senhaConfirm.classList.remove('is-invalid');
//   senha.nextElementSibling.style.right = '0.75rem'; // Resetar posição do ícone
//   senhaConfirm.nextElementSibling.style.right = '0.75rem'; // Resetar posição do ícone
// });

function validarSenha() {
  const senha = document.getElementById('password');
  const senhaConfirm = document.getElementById('confirmPassword');
  const senhaError = senha.nextElementSibling.nextElementSibling; // Ajustado para pular o ícone
  const senhaConfirmError = senhaConfirm.nextElementSibling.nextElementSibling;

  let isValid = true;

  if (senha.value.length < 6) {
    senha.classList.add('is-invalid');
    senhaError.style.display = 'block';
    senhaError.textContent = 'A senha deve ter pelo menos 6 caracteres.';
    // senha.nextElementSibling.style.right = '3rem'; 
    isValid = false;
  } else {
    senha.classList.remove('is-invalid');
    senhaError.style.display = 'none';
    // senha.nextElementSibling.style.right = '0.75rem'; 
  }

  if (senha.value !== senhaConfirm.value) {
    senhaConfirm.classList.add('is-invalid');
    senhaConfirmError.style.display = 'block';
    senhaConfirmError.textContent = 'As senhas não coincidem.';
    // senhaConfirm.nextElementSibling.style.right = '3rem';
    isValid = false;
  } else {
    senhaConfirm.classList.remove('is-invalid');
    senhaConfirmError.style.display = 'none';
    // senhaConfirm.nextElementSibling.style.right = '0.75rem';
  }

  return isValid;
}

document.getElementById('password').addEventListener('focusout', validarSenha);
document.getElementById('confirmPassword').addEventListener('focusout', validarSenha);

// function processarLogin(event) {
//   event.preventDefault();

//   // Se a validação for bem-sucedida, chama a função enviarDados
//   if (validarSenha()) {
//     enviarDados();
//   }
// }

// async function cadastrarUsuario(email, senha, status) {
//   try {
//     const response = await fetch('/api/usuarios', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ email, senha, status }),
//     });

//     if (response.ok) {
//       const data = await response.json();
//       alert('Usuário cadastrado com sucesso!');
//       window.location.href = '/TelaInicial/telainicial.html';
//     } else {
//       alert('Erro ao cadastrar o usuário.');
//     }
//   } catch (error) {
//     console.error('Erro:', error);
//     alert('Erro ao enviar os dados. Tente novamente.');
//   }
// }

// function enviarDados() {
//   const email = document.getElementById('email').value;
//   const senha = document.getElementById('senha').value;

//   // Chamar a função cadastrarUsuario com os dados capturados
//   cadastrarUsuario(email, senha, true);
// }

// document.addEventListener('DOMContentLoaded', function () {
//   var inputs = document.querySelectorAll('.form-control');

//   inputs.forEach(function (input) {
//     var label = input.previousElementSibling;

//     input.addEventListener('focus', function () {
//       input.classList.add('active');
//       label.classList.add('active');
//     });

//     input.addEventListener('blur', function () {
//       if (input.value.trim() === '') {
//         input.classList.remove('active');
//         label.classList.remove('active');
//       }
//     });

//     if (input.value.trim() !== '') {
//       input.classList.add('active');
//       label.classList.add('active');
//     }
//   });
// });

// document.addEventListener('DOMContentLoaded', function () {
//   var senhaInputs = document.querySelectorAll('.password-field');

//   senhaInputs.forEach(function (input) {
//     var label = input.previousElementSibling;

//     input.addEventListener('focus', function () {
//       input.classList.add('active');
//       label.classList.add('active');
//     });

//     input.addEventListener('blur', function () {
//       if (input.value.trim() === '') {
//         input.classList.remove('active');
//         label.classList.remove('active');
//       }
//     });

//     if (input.value.trim() !== '') {
//       input.classList.add('active');
//       label.classList.add('active');
//     }
//   });
// });

//verificação de CEP e auto completamento
async function validarCEP(input) {
  const onlyNumbers = /^[0-9]+$/;
  const cepValid = /^[0-9]{8}$/;
  const cepError = input.nextElementSibling;

  try {
    if (!onlyNumbers.test(input.value) || !cepValid.test(input.value)) {
      throw { cep_error: 'CEP inválido.' };
    }

    const response = await fetch(`https://viacep.com.br/ws/${input.value}/json/`);

    if (!response.ok) {
      throw await response.json();
    }

    const responseCep = await response.json();

    if (responseCep.erro) {
      throw { cep_error: 'CEP não encontrado.' };
    }

    rua.value = responseCep.logradouro;
    bairro.value = responseCep.bairro;
    cidade.value = `${responseCep.localidade} - ${responseCep.uf}`;

    input.classList.remove('is-invalid');
    cepError.style.display = 'none';
    input.value = input.value.replace(/(\d{5})(\d{3})/, '$1-$2');
    input.disabled = true;

  } catch (error) {
    if (error?.cep_error) {
      input.classList.add('is-invalid');
      cepError.style.display = 'block';
      cepError.textContent = error.cep_error;
    }

    console.log(error);
  }
}

cep.addEventListener('focusout', async () => {
  await validarCEP(cep);
});

//verificação de CPF
function validarCPF(input) {
  const cpfError = input.nextElementSibling;
  const cpfValid = /^[0-9]{11}$/;

  input.value = input.value.replace(/\D/g, '');

  if (cpfValid.test(input.value)) {
    input.value = input.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

    input.classList.remove('is-invalid');
    cpfError.style.display = 'none';
  } else {
    input.classList.add('is-invalid');
    cpfError.style.display = 'block';
    cpfError.textContent = 'Por favor, insira um CPF válido (ex: 123.456.789-00).';
  }
}

document.querySelectorAll('#cpf').forEach(cpfInput => {
  cpfInput.addEventListener('input', () => {
    cpfInput.value = cpfInput.value.replace(/\D/g, '');
  });

  cpfInput.addEventListener('focusout', () => {
    validarCPF(cpfInput);
  });
});

//validação de nome
function validarNome(input) {
  const nomeError = input.nextElementSibling;
  const nomeValid = /^[a-zA-ZÀ-ú]+\s[a-zA-ZÀ-ú\s]+$/;

  if (input.value.length < 3 || input.value.length > 50) {
    input.classList.add('is-invalid');
    nomeError.style.display = 'block';
    nomeError.textContent = 'Por favor, preencha o campo com entre 3 e 50 caracteres.';
  } else if (nomeValid.test(input.value)) {
    input.classList.remove('is-invalid');
    nomeError.style.display = 'none';
  } else {
    input.classList.add('is-invalid');
    nomeError.style.display = 'block';
    nomeError.textContent = 'Por favor, insira um nome válido';
  }
}

document.getElementById('name').addEventListener('focusout', function () {
  validarNome(this);
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

// Validação de idade
function validarIdade(input) {
  const idadeError = input.nextElementSibling;
  const data_nasc = new Date(input.value);
  const hoje = new Date();

  // Verifica se a data de nascimento está completa
  if (isNaN(data_nasc.getTime()) || input.value.length < 10) {
    input.classList.add('is-invalid');
    idadeError.style.display = 'block';
    idadeError.textContent = 'Por favor, insira uma data de nascimento válida.';
    document.getElementById("continue").style.display = 'none';
    return;
  }

  let idade = hoje.getFullYear() - data_nasc.getFullYear();
  const mes = hoje.getMonth() - data_nasc.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < data_nasc.getDate())) {
    idade--;
  }

  if (idade < 18) {
    input.classList.add('is-invalid');
    idadeError.style.display = 'block';
    idadeError.textContent = 'Você precisa ser maior de 18 anos para se cadastrar na plataforma.';
    document.getElementById("continue").style.display = 'none';
  } else {
    input.classList.remove('is-invalid');
    idadeError.style.display = 'none';
    idadeError.textContent = `Idade: ${idade} anos`;
    document.getElementById("continue").style.display = 'block';
  }
}

document.getElementById('dob').addEventListener('input', function () {
  validarIdade(this);
});

function validarNumeroComplemento(input) {
  const numeroError = input.nextElementSibling;
  const numeroValid = /^\d{1,6},\s[A-Za-z][A-Za-z0-9\s]*$/;

  if (numeroValid.test(input.value)) {
    input.classList.remove('is-invalid');
    numeroError.style.display = 'none';
  } else {
    input.classList.add('is-invalid');
    numeroError.style.display = 'block';
    numeroError.textContent = 'Campo inválido.';
  }
}

document.getElementById('number').addEventListener('focusout', function () {
  validarNumeroComplemento(this);
});

document.querySelectorAll('.toggle-password').forEach(icon => {
  icon.addEventListener('click', function () {
    const targetId = this.getAttribute('data-target');
    const targetInput = document.getElementById(targetId);

    if (targetInput.type === 'password') {
      targetInput.type = 'text';
      this.classList.remove('bi-eye-slash');
      this.classList.add('bi-eye');
    } else {
      targetInput.type = 'password';
      this.classList.remove('bi-eye');
      this.classList.add('bi-eye-slash');
    }
  });
});