import { showToast } from "../../../components/toast.js";

let sessionDataGlobal = null; //salvamento dos dados da sessão globalmente

async function carregarDados() {
    try {
        const response = await fetch("/api/session");
        const sessionData = await response.json();
        sessionDataGlobal = sessionData;

        if (!sessionData.estaAutenticado) {
            showToast("Você precisa estar autenticado para acessar esta página. Redirecionando para o login.", 'error');
            window.location.href = "/src/pages/login/login.html";
            return;
        }

        const nomeUsuario = document.getElementById('nomeUsuario');
        const idUsuario = document.getElementById('id');
        const email = document.getElementById('email');
        const telefone = document.getElementById('telefone');
        const endereco = document.getElementById('endereco');
        const nick = document.getElementById('nick');

        try {
            const APIcepResponse = await fetch(`https://viacep.com.br/ws/${sessionData.cep}/json/`);
            const APIcep = await APIcepResponse.json();

            if (APIcep.erro) throw "CEP inválido";

            endereco.textContent = `${APIcep.logradouro}, ${APIcep.bairro} - ${sessionData.numero} (${sessionData.complemento}) - ${APIcep.localidade} ${APIcep.uf}`;
        } catch {
            endereco.textContent = "Endereço não encontrado.";
        }

        nomeUsuario.textContent = sessionData.nomeUsuario;
        idUsuario.textContent = `#${sessionData.ID_usuario}`;
        email.textContent = sessionData.email;
        telefone.textContent = sessionData.telefone;
        nick.textContent = sessionData.nick;

    } catch (error) {
        console.error("Erro ao verificar sessão:", error);
    }

    document.querySelectorAll(".toggle-password").forEach(button => {
        const targetSpan = document.getElementById(button.dataset.target);

        if (!targetSpan.dataset.originalText) {
            targetSpan.dataset.originalText = targetSpan.textContent;
        }

        //começa com os dados ocultos
        targetSpan.textContent = "••••••••";
        targetSpan.dataset.visible = "false";

        button.addEventListener("click", () => {
            const visible = targetSpan.dataset.visible === "true";
            targetSpan.dataset.visible = String(!visible);

            targetSpan.textContent = visible
                ? "••••••••"
                : targetSpan.dataset.originalText;

            button.innerHTML = visible
                ? `<i class="bi bi-eye-slash"></i>`
                : `<i class="bi bi-eye"></i>`;
        });
    });
}

document.addEventListener("DOMContentLoaded", carregarDados);

async function excluirConta() {
    const id = sessionDataGlobal.ID_usuario;

    try {
        const response = await fetch("/api/usuarios/excluir", {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id })
        });

        if (response.ok) {
            showToast('Conta deletada com sucesso. Sentiremos a sua falta :(', 'success');
            sessionDataGlobal.estaAutenticado = false;
            logout();

        } else {
            const errorData = await response.json();
            showToast('Erro ao excluir a conta.', 'error');
        }
    } catch (err) {
        console.error('Erro:', err);
        showToast('Erro na exclusão de usuário. Tente novamente.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnEditarTudo = document.getElementById('btnEditarTudo');
    const modalEditarTudoElement = document.getElementById('modalEditarTudo');
    const modalEditarTudo = new bootstrap.Modal(modalEditarTudoElement);
    const formEditarTudo = document.getElementById('formEditarTudo');

    const modalExclusaoElement = document.getElementById('modalExclusao');
    const modalExclusao = new bootstrap.Modal(modalExclusaoElement);
    const btnExcluir = document.getElementById('excluir');
    const formExclusao = document.getElementById('formExcluir');

    //preenche o modal com os valores completos ao abrir
    modalEditarTudoElement.addEventListener('show.bs.modal', () => {
        document.getElementById('novoNickTudo').value = sessionDataGlobal.nick || '';
        document.getElementById('novoEmailTudo').value = sessionDataGlobal.email || '';
        document.getElementById('novoCepTudo').value = sessionDataGlobal.cep || '';
        document.getElementById('novoNumeroTudo').value = sessionDataGlobal.numero || '';
        document.getElementById('novoComplementoTudo').value = sessionDataGlobal.complemento || '';
        document.getElementById('novoTelefoneTudo').value = sessionDataGlobal.telefone || '';
    });

    btnEditarTudo.addEventListener('click', () => {
        modalEditarTudo.show();
    });

    btnExcluir.addEventListener('click', () => {
        modalExclusao.show();
    });

    // Obtém referências aos inputs do modal uma vez
    const novoCepInput = document.getElementById('novoCepTudo');
    const novoTelInput = document.getElementById('novoTelefoneTudo');
    const novoEmailInput = document.getElementById('novoEmailTudo');
    const confirmacao = document.getElementById('confirmacao');

    // Adiciona a validação enquanto o usuário digita
    confirmacao.addEventListener('input', () => {
        if (confirmacao.value === sessionDataGlobal.nick) {
            confirmacao.classList.remove('is-invalid');
        } else {
            confirmacao.classList.add('is-invalid');
        }
    });

    // Aplica máscaras e feedback assim que o input perde o foco
    novoCepInput.addEventListener('focusout', async () => {
        const rawCep = novoCepInput.value.replace(/\D/g, '');
        novoCepInput.value = rawCep.replace(/(\d{5})(\d{3})/, '$1-$2');
        try {
            const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
            const data = await res.json();
            if (data.erro) {
                novoCepInput.classList.add('is-invalid');
            } else {
                novoCepInput.classList.remove('is-invalid');
            }
        } catch {
            novoCepInput.classList.add('is-invalid');
        }
    });

    novoTelInput.addEventListener('focusout', () => {
        const raw = novoTelInput.value.replace(/\D/g, '');
        let formatted = '';
        if (raw.length === 11) {
            if (raw[2] === '9') {
                formatted = raw.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, '($1) $2-$3-$4');
                novoTelInput.classList.remove('is-invalid');
            } else {
                novoTelInput.classList.add('is-invalid');
                return;
            }
        } else if (raw.length === 10) {
            formatted = raw.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
            novoTelInput.classList.remove('is-invalid');
        } else {
            novoTelInput.classList.add('is-invalid');
            return;
        }
        novoTelInput.value = formatted;
    });

    novoEmailInput.addEventListener('focusout', () => {
        const emailVal = novoEmailInput.value.trim();
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(emailVal)) {
            novoEmailInput.classList.add('is-invalid');
        } else {
            novoEmailInput.classList.remove('is-invalid');
        }
    });

    formExclusao.addEventListener('submit', (event) => {
        event.preventDefault();
        // Somente prossegue se o input não possuir a classe "is-invalid"
        if (confirmacao.classList.contains('is-invalid')) {
            showToast('Corrija os erros antes de continuar', 'error');
            return;
        }
        showToast('Sentiremos saudades :(', 'success');
        excluirConta();
    });

    formEditarTudo.addEventListener('submit', async (event) => {
        const invalidFields = formEditarTudo.querySelectorAll(".is-invalid");

        if (invalidFields.length > 0) {
            event.preventDefault();
            event.stopPropagation();
            showToast("Por favor, corrija os campos inválidos antes de continuar.", 'error');
            return;
        }

        event.preventDefault();
        const dadosParaEnviar = {};

        const novoNickInput = document.getElementById('novoNickTudo');
        const novoNumeroInput = document.getElementById('novoNumeroTudo');
        const novoComplementoInput = document.getElementById('novoComplementoTudo');

        if (novoNickInput.value !== sessionDataGlobal.nick) {
            dadosParaEnviar.nick = novoNickInput.value;
        }
        if (novoEmailInput.value !== sessionDataGlobal.email) {
            dadosParaEnviar.email = novoEmailInput.value;
        }
        if (novoCepInput.value !== sessionDataGlobal.cep) {
            dadosParaEnviar.cep = novoCepInput.value;
        }
        if (novoNumeroInput.value !== sessionDataGlobal.numero) {
            dadosParaEnviar.numero = novoNumeroInput.value;
        }
        if (novoComplementoInput.value !== sessionDataGlobal.complemento) {
            dadosParaEnviar.complemento = novoComplementoInput.value;
        }
        if (novoTelInput.value !== sessionDataGlobal.telefone) {
            dadosParaEnviar.telefone = novoTelInput.value;
        }

        if (Object.keys(dadosParaEnviar).length > 0) {
            console.log('Enviando dados modificados:', dadosParaEnviar);
            try {
                const response = await fetch('/api/usuarios/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosParaEnviar),
                });

                if (response.ok) {
                    modalEditarTudo.hide();
                    showToast(
                        'Dados atualizados com sucesso!', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                } else {
                    const errorData = await response.json();
                    console.error('Erro ao atualizar o perfil:', errorData);
                    showToast(
                        'Erro ao atualizar o perfil.',  'error');
                }
            } catch (error) {
                console.error('Erro de rede:', error);
                showToast('Erro de conexão ao banco de dados.', 'error');
            }
        } else {
            modalEditarTudo.hide();
            showToast('Nenhum dado alterado.', 'error');
        }
    });
});

async function uploadFoto(input) {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('foto', file);

    try {
        const response = await fetch('/api/usuarios/uploadFoto', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Upload feito com sucesso!', 'success');
            // Atualiza a imagem do perfil no front-end
            const fotoPerfil = document.getElementById('fotoPerfil');
            fotoPerfil.src = `/api/usuarios/foto?${Date.now()}`; // Adiciona um timestamp para evitar cache
        } else {
            showToast('Erro ao enviar a foto', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Erro inesperado ao enviar a foto.', 'error');
    }
}

function validarSenha() {
    const senha = document.getElementById('password');
    const confirmSenha = document.getElementById('confirmPassword');

    const senhaError = document.getElementById('feedbackSenha');
    const confirmSenhaError = document.getElementById('feedbackSenhaDif');

    let isValid = true;

    if (senha.value.length < 6) {
        senha.classList.add('is-invalid');
        senhaError.textContent = 'A senha precisa ter no mínimo 6 caracteres.';
        isValid = false;
    } else {
        senha.classList.remove('is-invalid');
        senhaError.textContent = '';
    }

    //verifica se as senhas coincidem
    if (confirmSenha.value !== senha.value || confirmSenha.value.length < 6) {
        confirmSenha.classList.add('is-invalid');
        confirmSenhaError.textContent = 'As senhas não coincidem ou são muito curtas.';
        isValid = false;

    } else {
        confirmSenha.classList.remove('is-invalid');
        confirmSenhaError.textContent = '';
    }

    return isValid;
}

document.getElementById('password').addEventListener('input', validarSenha);
document.getElementById('confirmPassword').addEventListener('input', validarSenha);

//olho para mostrar a senha
document.querySelectorAll('.toggle-password-modal').forEach(icon => {
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

function logout() {
    window.location.href = "/logout"
}