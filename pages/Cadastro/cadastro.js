const cep = document.querySelector('#cep');
const rua = document.querySelector('#street');
const bairro = document.querySelector('#bairro');
const cidade = document.querySelector('#cidade');
const numero = document.querySelector('#number');
const mensagem = document.querySelector('.invalid-feedback');
const cpf = document.getElementById('cpf').value;
const nome = document.getElementById('name').value;

function validarSenha() {
  const senha = document.getElementById('password');
  const senhaConfirm = document.getElementById('confirmPassword');
  const senhaError = document.getElementById('password').nextElementSibling;
  const senhaConfirmError = document.getElementById('confirmPassword').nextElementSibling;

  let isValid = true;

  if (senha.value.length < 6) {
    senha.classList.add('is-invalid');
    senhaError.style.display = 'block';
    senhaError.textContent = 'A senha deve ter pelo menos 6 caracteres.';
    isValid = false;
  } else {
    senha.classList.remove('is-invalid');
    senhaError.style.display = 'none';
  }

  if (senha.value !== senhaConfirm.value) {
    senhaConfirm.classList.add('is-invalid');
    senhaConfirmError.style.display = 'block';
    senhaConfirmError.textContent = 'As senhas não coincidem.';
    isValid = false;
  } else {
    senhaConfirm.classList.remove('is-invalid');
    senhaConfirmError.style.display = 'none';
  }

  return isValid;
}

document.getElementById('password').addEventListener('focusout', validarSenha);
document.getElementById('confirmPassword').addEventListener('focusout', validarSenha);

function processarLogin(event) {
  event.preventDefault();

  // Se a validação for bem-sucedida, chama a função enviarDados
  if (validarSenha()) {
    enviarDados();
  }
}

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
  const nomeValid = /^[a-zA-ZÀ-ú\s]+$/;

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
    nomeError.textContent = 'Por favor, insira um nome válido.';
  }
}

document.getElementById('name').addEventListener('focusout', function () {
  validarNome(this);
});