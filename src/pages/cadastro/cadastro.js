//gerador de nick's aleatórios
function gerarNickAleatorio() {
  const adjetivos = ['Furioso', 'Preguiçoso', 'Malandro', 'Feliz', 'Silencioso'];
  const nomes = ['Tigre', 'Ninja', 'Panda', 'Falcão', 'Mago'];
  const numero = Math.floor(Math.random() * 1000);

  const adjetivo = adjetivos[Math.floor(Math.random() * adjetivos.length)];
  const nome = nomes[Math.floor(Math.random() * nomes.length)];

  return `${adjetivo}${nome}${numero}`;
}

function processarCadastro(event) {
  event.preventDefault();

  const submitButton = document.querySelector('#continue');
  submitButton.disabled = true;

  const nome = document.getElementById('name').value.trim();
  const nick = gerarNickAleatorio();
  const dataNasc = document.getElementById('dob').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('password').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const cep = document.getElementById('cep');
  const numero = document.getElementById('number').value.trim();
  const complemento = document.getElementById('complemento').value.trim();
  const genero = document.getElementById('genero').value.trim();
  const telefone = document.getElementById('telefone').value.trim();

  const nomeValido = validarNome(document.getElementById('name'));
  const emailValido = validarEmail(document.getElementById('email'));
  const senhaValida = validarSenha();
  const cpfValido = validarCPF(document.getElementById('cpf'));
  const idadeValida = validarIdade(document.getElementById('dob'));
  const cepValido = !cep.classList.contains('is-invalid');
  const telefoneValido = validarTelefone(document.getElementById('telefone'));

  if (nomeValido && emailValido && senhaValida && cpfValido && idadeValida && cepValido && telefoneValido) {
    enviarDados(nome, nick, dataNasc, email, senha, cpf, cep.value.trim(), numero, complemento, genero, telefone);
  } else {
    alert('Por favor, corrija os erros antes de continuar.');
    submitButton.disabled = false;
  }
}

function enviarDados(nome, nick, dataNasc, email, senha, cpf, cep, numero, complemento, genero, telefone) {
  cadastrarUsuario(nome, nick, dataNasc, email, senha, cpf, cep, numero, complemento, genero, telefone);
}

async function cadastrarUsuario(nome, nick, dataNasc, email, senha, cpf, cep, numero, complemento, genero, telefone) {
  try {
    const response = await fetch('/api/usuarios/criar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome,
        nick,
        dataNascimento: dataNasc,
        email,
        senha,
        cpf,
        cep,
        numero,
        complemento,
        genero,
        telefone
      }),
    });

    if (response.ok) {
      const data = await response.json();
      alert('Usuário cadastrado com sucesso!');
      window.location.href = '/login/login.html';
    } else {
      const errorData = await response.json();
      alert(errorData.message || 'Erro ao cadastrar o usuário.');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao enviar os dados. Tente novamente.');
  } finally {
    document.querySelector('#continue').disabled = false;
  }
}

function validarSenha() {
  const senha = document.getElementById('password');
  const senhaConfirm = document.getElementById('confirmPassword');
  const senhaError = senha.parentElement.querySelector('.invalid-feedback');
  const senhaConfirmError = senhaConfirm.parentElement.querySelector('.invalid-feedback');

  let isValid = true;

  if (senhaError) {
    if (senha.value.length < 6) {
      senha.classList.add('is-invalid');
      senhaError.style.display = 'block';
      senhaError.textContent = 'A senha deve ter pelo menos 6 caracteres.';
      isValid = false;
    } else {
      senha.classList.remove('is-invalid');
      senhaError.style.display = 'none';
    }
  }

  if (senhaConfirmError) {
    if (senhaConfirm.value.length === 0 || senha.value !== senhaConfirm.value) {
      senhaConfirm.classList.add('is-invalid');
      senhaConfirmError.style.display = 'block';
      senhaConfirmError.textContent = 'As senhas não coincidem.';
      isValid = false;
    } else {
      senhaConfirm.classList.remove('is-invalid');
      senhaConfirmError.style.display = 'none';
    }
  }

  return isValid;
}

document.getElementById('password').addEventListener('input', validarSenha); // Validar em tempo real
document.getElementById('confirmPassword').addEventListener('input', validarSenha); // Validar em tempo real

//verificação de CEP e auto completamento
async function validarCEP(input) {
  const rua = document.querySelector('#street');
  const bairro = document.querySelector('#bairro');
  const cidade = document.querySelector('#cidade');

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

document.getElementById('cep').addEventListener('focusout', async () => {
  await validarCEP(document.getElementById('cep'));
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
  const minimo = new Date('1925-04-14')

  //verifica se a data de nascimento está completa
  if (isNaN(data_nasc.getTime()) || input.value.length < 10 || minimo > data_nasc.getTime()) {
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

  // Remover a máscara antes de validar
  const telefoneSemMascara = input.value.replace(/\D/g, '');

  if (telefoneValid.test(telefoneSemMascara)) {
    if (telefoneSemMascara.length === 11 && telefoneSemMascara[2] !== '9') {
      input.classList.add('is-invalid');
      return false;
    }

    // Aplicar a máscara novamente
    if (telefoneSemMascara.length === 11) {
      input.value = telefoneSemMascara.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, '($1) $2-$3-$4');
    } else {
      input.value = telefoneSemMascara.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }

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