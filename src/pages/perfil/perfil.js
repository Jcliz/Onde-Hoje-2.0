let sessionDataGlobal = null; //salvamento dos dados da sessão globalmente

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("/api/session");
        const sessionData = await response.json();
        sessionDataGlobal = sessionData;

        if (!sessionData.estaAutenticado) {
            alert("Você precisa estar autenticado para acessar esta página. Redirecionando para o login.");
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

    // Toggle campos sensíveis
    document.querySelectorAll(".toggle-password").forEach(button => {
        const targetSpan = document.getElementById(button.dataset.target);

        // Salva o texto original antes de esconder
        if (!targetSpan.dataset.originalText) {
            targetSpan.dataset.originalText = targetSpan.textContent;
        }

        // Começa com os dados ocultos
        targetSpan.textContent = "••••••••";
        targetSpan.dataset.visible = "false";

        // Agora adiciona o listener
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
});

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
            const data = await response.json();
            alert('Conta deletada com sucesso. Sentiremos a sua falta :(');
            sessionDataGlobal.estaAutenticado = false;
            window.location.href = '/logout';
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Erro ao excluir a conta.');
        }
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro na exclusão de usuário. Tente novamente.');
    }
}

async function atualizarDados() {
    const nick = document.getElementById('novoValorNick')?.value || sessionDataGlobal.nick;
    const email = document.getElementById('novoValorEmail')?.value || sessionDataGlobal.email;
    const cep = document.getElementById('novoValorCEP')?.value || sessionDataGlobal.cep;
    const numero = document.getElementById('numero')?.value || sessionDataGlobal.numero;
    const complemento = document.getElementById('complemento')?.value || sessionDataGlobal.complemento;
    const telefone = document.getElementById('novoValorTel')?.value || sessionDataGlobal.telefone;

    try {
        const response = await fetch("/api/usuarios/update", {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nick,
                email,
                cep,
                numero,
                complemento,
                telefone
            })
        });

        if (response.ok) {
            alert("Dados atualizados com sucesso!");
            location.reload();
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Erro ao atualizar os dados.');
        }
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro na atualização de dados. Tente novamente.');
    }
}

async function abrirModal(campoId, label) {
    document.getElementById('labelCampo').innerText = `Novo(a) ${label}`;
    document.getElementById('campoAtual').value = campoId;

    let novoValorCEP = document.getElementById('novoValorCEP');
    let novoValorTel = document.getElementById('novoValorTel');
    let novoValorEmail = document.getElementById('novoValorEmail');

    // Reseta erros
    [novoValorCEP, novoValorTel, novoValorEmail].forEach(el => el?.classList.remove('is-invalid'));

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
                    // Celular válido
                    formatted = raw.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, '($1) $2-$3-$4');
                    novoValorTel.classList.remove('is-invalid');
                } else {
                    // 11 dígitos, mas não é celular válido
                    novoValorTel.classList.add('is-invalid');
                    return;
                }
            } else if (raw.length === 10) {
                // Fixo válido
                formatted = raw.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
                novoValorTel.classList.remove('is-invalid');
            } else {
                // Número inválido
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
    } else {
        const modal = new bootstrap.Modal(document.getElementById('editarModal'));
        modal.show();
    }
}

document.querySelectorAll("form").forEach(form => {
    form.addEventListener('submit', function (e) {
        const invalidFields = form.querySelectorAll(".is-invalid");
        if (invalidFields.length > 0) {
            e.preventDefault(); //cancela envio
            e.stopPropagation();
            alert("Por favor, corrija os campos inválidos antes de salvar.");
            return;
        } else {
            atualizarDados();
        }

        const modalId = form.closest(".modal")?.id;
        if (modalId) {
            const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
            modal.hide();
        }
    });
});

function logout() {
    window.location.href = "/logout";
}