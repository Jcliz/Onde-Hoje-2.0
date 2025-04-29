let sessionDataGlobal = null; //salvamento dos dados da sessão globalmente

async function carregarDados() {
    try {
        const response = await fetch("/api/session");
        const sessionData = await response.json();
        sessionDataGlobal = sessionData;

        if (!sessionData.estaAutenticado) {
            showModal("Você precisa estar autenticado para acessar esta página. Redirecionando para o login.");
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

document.addEventListener("DOMContentLoaded", carregarDados());

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
            showModal('Conta deletada com sucesso. Sentiremos a sua falta :(');
            sessionDataGlobal.estaAutenticado = false;
            window.location.href = '/logout';
        } else {
            const errorData = await response.json();
            showModal(errorData.message || 'Erro ao excluir a conta.');
        }
    } catch (err) {
        console.error('Erro:', err);
        showModal('Erro na exclusão de usuário. Tente novamente.');
    }
}

async function atualizarDados() {
    const nick = document.getElementById('novoValorNick')?.value;
    const email = document.getElementById('novoValorEmail')?.value;
    const cep = document.getElementById('novoValorCEP')?.value;
    const numero = document.getElementById('numero')?.value;
    const complemento = document.getElementById('complemento')?.value;
    const telefone = document.getElementById('novoValorTel')?.value;
    const senha = document.getElementById('password')?.value;

    const response = await fetch("/api/usuarios/update", {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            nick,
            email,
            senha,
            cep,
            numero,
            complemento,
            telefone
        })
    });

    if (response.ok) {
        location.reload();
        return response;

    } else {
        const errorData = await response.json();
        showModal(errorData.message || 'Erro ao atualizar os dados.');
        throw new Error(errorData.message || 'Erro ao atualizar os dados.');
    }
}

async function abrirModal(campoId, label) {
    document.getElementById('labelCampo').innerText = `Novo(a) ${label}`;
    document.getElementById('campoAtual').value = campoId;

    let novoValorCEP = document.getElementById('novoValorCEP');
    let novoValorTel = document.getElementById('novoValorTel');
    let novoValorEmail = document.getElementById('novoValorEmail');
    let confirmacao = document.getElementById('confirmacao');

    //reseta erros
    [novoValorCEP, novoValorTel, novoValorEmail, confirmacao].forEach(el => el?.classList.remove('is-invalid'));

    if (campoId === 'endereco') {
        document.getElementById('labelCampoCEP').innerText = `Novo(a) ${label}`;
        const modalCEP = new bootstrap.Modal(document.getElementById('modalCep'));
        modalCEP.show();

        novoValorCEP.addEventListener('focusout', async () => {
            const rawCep = novoValorCEP.value.replace(/\D/g, '');
            novoValorCEP.value = rawCep.replace(/(\d{5})(\d{3})/, '$1-$2');

            try {
                const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
                const data = await res.json();

                if (data.erro) {
                    novoValorCEP.classList.add('is-invalid');
                } else {
                    novoValorCEP.classList.remove('is-invalid');
                }
            } catch {
                novoValorCEP.classList.add('is-invalid');
            }
        });

    } else if (campoId === 'telefone') {
        document.getElementById('labelCampoTel').innerText = `Novo(a) ${label}`;
        const modal = new bootstrap.Modal(document.getElementById('modalTelefone'));
        modal.show();

        novoValorTel.addEventListener('focusout', () => {
            const raw = novoValorTel.value.replace(/\D/g, '');
            let formatted = '';

            if (raw.length === 11) {
                if (raw[2] === '9') {
                    formatted = raw.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, '($1) $2-$3-$4');
                    novoValorTel.classList.remove('is-invalid');
                } else {
                    novoValorTel.classList.add('is-invalid');
                    return;
                }
            } else if (raw.length === 10) {
                formatted = raw.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
                novoValorTel.classList.remove('is-invalid');
            } else {
                novoValorTel.classList.add('is-invalid');
                return;
            }

            novoValorTel.value = formatted;
        });

    } else if (campoId === 'email') {
        document.getElementById('labelCampoEmail').innerText = `Novo(a) ${label}`;
        const modalEmail = new bootstrap.Modal(document.getElementById('modalEmail'));
        modalEmail.show();

        novoValorEmail.addEventListener('focusout', () => {
            const emailVal = novoValorEmail.value.trim();
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regex.test(emailVal)) {
                novoValorEmail.classList.add('is-invalid');
            } else {
                novoValorEmail.classList.remove('is-invalid');
            }
        });
    } else if (campoId == 'exclusao') {
        document.getElementById('labelCampoExclusao').innerText = label;
        const modal = new bootstrap.Modal(document.getElementById('modalExclusao'));
        modal.show();

        confirmacao.addEventListener('input', () => {
            if (confirmacao.value.trim() !== sessionDataGlobal.nick) {
                confirmacao.classList.add('is-invalid');
            } else {
                confirmacao.classList.remove('is-invalid');
            }
        });

    } else {
        const modal = new bootstrap.Modal(document.getElementById('editarModal'));
        modal.show();
    }
}

document.querySelectorAll("form").forEach(form => {
    form.addEventListener('submit', async function (e) {
        const invalidFields = form.querySelectorAll(".is-invalid");
        if (invalidFields.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            showModal("Por favor, corrija os campos inválidos antes de continuar.");
            return;
        }

        e.preventDefault();

        if (form.id === 'formEditarExcluir') {
            excluirConta(); //só executa essa função
        } else {
            await atualizarDados();
            showModal("Dados atualizados com sucesso!");
        }

        // Fecha o modal sempre, independente de qual form for
        const modalId = form.closest(".modal")?.id;
        if (modalId) {
            const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
            modal.hide();
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
            showModal(data.mensagem || 'Upload feito com sucesso!');
            document.getElementById('fotoPerfil').src = `/api/usuarios/foto?${Date.now()}`;
        } else {
            showModal(data.erro || 'Erro ao enviar a foto');
        }
    } catch (err) {
        console.error(err);
        showModal('Erro inesperado ao enviar a foto.');
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

function showModal(message) {
    console.log(message);  // Verifique se a mensagem está sendo passada corretamente.

    // Fechar qualquer modal já aberto
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
    });

    // Limpar os campos de input dentro do modal (caso existam)
    const inputs = document.querySelectorAll('#alert-modal input');
    inputs.forEach(input => {
        input.value = ''; // Limpa o valor do input
    });

    // Exibir o novo modal
    const modalMessage = document.getElementById('modal-message');
    const modal = new bootstrap.Modal(document.getElementById('alert-modal'));
    
    modalMessage.textContent = message;  // Aqui o texto é atribuído
    modal.show();
}
