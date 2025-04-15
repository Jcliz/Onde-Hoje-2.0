function toggleText() {
    const button = document.getElementById("toggleButton");

    if (button.innerHTML.trim() === "Seguir") {
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0,0,256,256">
<g fill="#ffffff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(9.84615,9.84615)"><path d="M22.56641,4.73047l-1.79297,-1.21875c-0.49609,-0.33594 -1.17578,-0.20703 -1.50781,0.28516l-8.78906,12.96094l-4.03906,-4.03906c-0.42187,-0.42187 -1.10937,-0.42187 -1.53125,0l-1.53516,1.53516c-0.42187,0.42188 -0.42187,1.10938 0,1.53516l6.21094,6.21094c0.34766,0.34766 0.89453,0.61328 1.38672,0.61328c0.49219,0 0.98828,-0.30859 1.30859,-0.77344l10.57813,-15.60547c0.33594,-0.49219 0.20703,-1.16797 -0.28906,-1.50391z"></path></g></g>
</svg>
        `;
    } else {
        button.innerHTML = "Seguir";
    }
}

function logout() {
    window.location.href = "/logout";
}

function abrirModal(campoId, label) {
    let novoValorEmail = document.getElementById('novoValorEmail');
    let novoValorCEP = document.getElementById('novoValorCEP');
    let novoValorTel = document.getElementById('novoValorTel');

    if (campoId == 'endereco') {
        document.getElementById('labelCampoCEP').innerText = `Novo(a) ${label}`;

        const modalCEP = new bootstrap.Modal(document.getElementById('modalCep'));
        modalCEP.show();

        novoValorCEP.addEventListener('focusout', () => {
            novoValorCEP.value = novoValorCEP.value.replace(/(\d{5})(\d{3})/, '$1-$2');
        });

    } else if (campoId == 'telefone') {
        document.getElementById('labelCampoTel').innerText = `Novo(a) ${label}`;

        const modal = new bootstrap.Modal(document.getElementById('modalTelefone'));
        modal.show();

        novoValorTel.addEventListener('focusout', () => {
            if (novoValorTel.value.length === 11) {
                novoValorTel.value = novoValorTel.value.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, '($1) $2-$3-$4');
            } else {
                novoValorTel.value = novoValorTel.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
            }
        });

    } else if (campoId == 'email') {
        document.getElementById('labelCampoEmail').innerText = `Novo(a) ${label}`;

        const modal = new bootstrap.Modal(document.getElementById('modalEmail'));
        modal.show();

        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        novoValorEmail.addEventListener('focusout', () => {
            if (novoValorEmail.value.length < 5 || novoValorEmail.value.length > 50) {
                novoValorEmail.classList.add('is-invalid');
    
            } else if (emailValid.test(novoValorEmail.value)) {
                novoValorEmail.classList.remove('is-invalid');

            } else {
                novoValorEmail.classList.add('is-invalid');
            }
        });
    }
}

document.getElementById('formEditar').addEventListener('submit', function (e) {
    e.preventDefault();

    //TO-DO
    //fazer a requisição
    //corrigir submit modal email
    const modalElement = bootstrap.Modal.getInstance(document.getElementById('editarModal'));
    modalElement.hide();
});

document.addEventListener("DOMContentLoaded", async function () {
    // fetch de sessão
    try {
        const response = await fetch("/api/session");
        const sessionData = await response.json();

        if (!sessionData.estaAutenticado) {
            alert("Você precisa estar autenticado para acessar esta página. Redirecionando para o login.");
            window.location.href = "/src/pages/login/login.html";
            return;
        }

        let nomeUsuario = document.getElementById('nomeUsuario');
        let idUsuario = document.getElementById('id');
        let email = document.getElementById('email');
        let telefone = document.getElementById('telefone');
        let endereco = document.getElementById('endereco');
        let nick = document.getElementById('nick');

        try {
            const APIcepResponse = await fetch(`https://viacep.com.br/ws/${sessionData.cep}/json/`);
            const APIcep = await APIcepResponse.json();

            endereco.textContent = `${APIcep.logradouro}, ${APIcep.bairro} - ${sessionData.numero} - ${APIcep.localidade} ${APIcep.uf}`;
        } catch (error) {
            console.error("Erro ao buscar informações do CEP:", error);
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

    // função de mostrar/esconder campos sensíveis
    const toggleButtons = document.querySelectorAll(".toggle-password");

    toggleButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.target;
            const targetSpan = document.getElementById(targetId);

            if (targetSpan.dataset.visible === "true") {
                targetSpan.dataset.visible = "false";
                targetSpan.dataset.originalText = targetSpan.textContent;
                targetSpan.textContent = "••••••••";
                button.innerHTML = `<i class="bi bi-eye-slash"></i>`;
            } else {
                targetSpan.dataset.visible = "true";
                targetSpan.textContent = targetSpan.dataset.originalText;
                button.innerHTML = `<i class="bi bi-eye"></i>`;
            }
        });
    });
});