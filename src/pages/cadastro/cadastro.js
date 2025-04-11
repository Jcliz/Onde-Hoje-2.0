const cep = document.querySelector('#cep');
const rua = document.querySelector('#street');
const bairro = document.querySelector('#bairro');
const cidade = document.querySelector('#cidade');
const numero = document.querySelector('#number');
const mensagem = document.querySelector('.invalid-feedback');
const senha = document.getElementById('password');
const telefone = document.getElementById('telefone');

function validarSenha() {
  const senhaConfirm = document.getElementById('confirmPassword');
  const senhaError = senha.parentElement.querySelector('.invalid-feedback');
  const senhaConfirmError = senhaConfirm.parentElement.querySelector('.invalid-feedback');

  let isValid = true;

  if (senha.value.length < 6) {
    senha.classList.add('is-invalid');
    if (senhaError) {
      senhaError.style.display = 'block';
      senhaError.textContent = 'A senha deve ter pelo menos 6 caracteres.';
    }
    isValid = false;
  } else {
    senha.classList.remove('is-invalid');
    if (senhaError) {
      senhaError.style.display = 'none';
    }
  }

  if (senha.value !== senhaConfirm.value) {
    senhaConfirm.classList.add('is-invalid');
    if (senhaConfirmError) {
      senhaConfirmError.style.display = 'block';
      senhaConfirmError.textContent = 'As senhas não coincidem.';
    }
    isValid = false;
  } else {
    senhaConfirm.classList.remove('is-invalid');
    if (senhaConfirmError) {
      senhaConfirmError.style.display = 'none';
    }
  }

  return isValid;
}

document.getElementById('password').addEventListener('focusout', validarSenha);
document.getElementById('confirmPassword').addEventListener('focusout', validarSenha);

//TO-DO
//após clicar em limpar o campo de cep fica liberado para usar
function processarCadastro(event) {
  event.preventDefault();

  //atualização dos valores dos campos no momento do envio
  const nome = document.getElementById('name').value;
  const dataNasc = document.getElementById('dob').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('password').value;
  const cpf = document.getElementById('cpf').value;
  const cep = document.getElementById('cep').value;
  const numero = document.getElementById('number').value;

  const nomeValido = validarNome(document.getElementById('name'));
  const emailValido = validarEmail(document.getElementById('email'));
  const senhaValida = validarSenha();
  const cpfValido = validarCPF(document.getElementById('cpf'));
  const idadeValida = validarIdade(document.getElementById('dob'));
  const cepValido = document.getElementById('cep').classList.contains('is-invalid') === false;

  if (nomeValido && emailValido && senhaValida && cpfValido && idadeValida && cepValido) {
    enviarDados(nome, dataNasc, email, senha, cpf, cep, numero);

  } else {
    alert('Por favor, corrija os erros antes de continuar.');
  }
}

function enviarDados(nome, dataNasc, email, senha, cpf, cep, numero) {
  cadastrarUsuario(nome, dataNasc, email, senha, cpf, cep, numero);
}

async function cadastrarUsuario(nome, dataNascimento, email, senha, cpf, cep, complemento) {
  try {
    const response = await fetch('/api/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nome, dataNascimento, email, senha, cpf, cep, complemento }),
    });

    if (response.ok) {
      const data = await response.json();
      alert('Usuário cadastrado com sucesso!');
      window.location.href = '/login/login.html'; // Redireciona para a tela de login
    } else {
      alert('Erro ao cadastrar o usuário.');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao enviar os dados. Tente novamente.');
  }
}

//verificação de CEP e auto completamento
async function validarCEP(input) {
  const onlyNumbers = /^[0-9]+$/;
  const cepValid = /^[0-9]{8}$/;

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
    input.value = input.value.replace(/(\d{5})(\d{3})/, '$1-$2');
    input.disabled = true;

  } catch (error) {
    if (error?.cep_error) {
      input.classList.add('is-invalid');
    }
  }

  //reativa o campo de CEP ao resetar o formulário
  document.querySelector('form').addEventListener('reset', function () {
    input.disabled = false;
    input.value = '';
    input.classList.remove('is-invalid');
    if (error?.cep_error) {
      cep_error.style.display = 'none';
    }
  });
}

cep.addEventListener('focusout', async () => {
  await validarCEP(cep);
});

//verificação de CPF
function validarCPF(input) {
  const cpfValid = /^[0-9]{11}$/;

  input.value = input.value.replace(/\D/g, '');

  if (cpfValid.test(input.value)) {
    input.value = input.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    input.classList.remove('is-invalid');
    return true;

  } else {
    input.classList.add('is-invalid');
    return false;
  }
}

//apenas números no campo de CPF
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
  const nomeValid = /^[a-zA-ZÀ-ú]+\s[a-zA-ZÀ-ú\s]+$/;

  if (input.value.length < 3 || input.value.length > 50) {
    input.classList.add('is-invalid');
    return false;

  } else if (nomeValid.test(input.value)) {
    input.classList.remove('is-invalid');
    return true;

  } else {
    input.classList.add('is-invalid');
    return false;

  }
}

//apenas letras e espaços
document.querySelectorAll('#name').forEach(nameInput => {
  nameInput.addEventListener('input', () => {
    nameInput.value = nameInput.value.replace(/[^a-zA-ZÀ-ú\s]/g, '');
  });
});

document.getElementById('name').addEventListener('focusout', function () {
  validarNome(this);
});

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

function validarIdade(input) {
  const data_nasc = new Date(input.value);
  const hoje = new Date();

  //verifica se a data de nascimento está completa
  if (isNaN(data_nasc.getTime()) || input.value.length < 10) {
    input.classList.add('is-invalid');
    return false;
  }

  let idade = hoje.getFullYear() - data_nasc.getFullYear();
  const mes = hoje.getMonth() - data_nasc.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < data_nasc.getDate())) {
    idade--;
  }

  if (idade < 18) {
    input.classList.add('is-invalid');
    return false;

  } else {
    input.classList.remove('is-invalid');
    return true;
  }
}

document.getElementById('dob').addEventListener('input', function () {
  validarIdade(this);
});

//apenas numeros no campo de numero
document.getElementById('number').addEventListener('input', function () {
  this.value = this.value.replace(/[^0-9]/g, ''); 
});

function validarTelefone(input) {
  const telefoneValid = /^[0-9]{10,11}$/;

  if (telefoneValid.test(input.value)) {
    //máscara ao telefone
    input.value = input.value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    input.classList.remove('is-invalid');
    return true;

  } else {
    input.classList.add('is-invalid');
    return false;
  }
}

document.getElementById('telefone').addEventListener('focusout', function () {
  validarTelefone(this);
});

document.getElementById('telefone').addEventListener('input', function () {
  this.value = this.value.replace(/[^0-9]/g, '');
});

//olho para mostrar a senha
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