document.addEventListener("DOMContentLoaded", async function () {
    fetch("/api/session")
        .then(response => response.json())
        .then(async sessionData => {
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

                nomeUsuario.textContent = sessionData.nomeUsuario;
                idUsuario.textContent = `#${sessionData.ID_usuario}`;
                email.textContent = sessionData.email;
                telefone.textContent = sessionData.telefone;
                endereco.textContent = `${APIcep.logradouro}, ${APIcep.bairro} - ${sessionData.numero} - ${APIcep.localidade} ${APIcep.uf}`;
                nick.textContent = sessionData.nick;

            } catch (error) {
                console.error("Erro ao buscar informações do CEP:", error);
                endereco.textContent = "Endereço não encontrado.";
            }
        })
        .catch(error => console.error("Erro ao verificar sessão:", error));
});

var menuButton = document.getElementById("menu-button");
var menu = document.getElementById("menu");
var content = document.getElementById("content");

menuButton.addEventListener("click", function () {
    if (menu.classList.contains("menu-show")) {
        menu.classList.remove("menu-show");
        menu.classList.add("menu-hide");
        content.classList.add("content-expanded");
    } else {
        menu.classList.remove("menu-hide");
        menu.classList.add("menu-show");
        content.classList.remove("content-expanded");
    }
});

function toggleText() {
    const button = document.getElementById("toggleButton");

    // Verifica o estado atual do botão e alterna entre "Seguir" e o SVG
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
    const campo = document.getElementById(campoId);
    document.getElementById('novoValor').value = campo.textContent;
    document.getElementById('campoAtual').value = campoId;
    document.getElementById('labelCampo').textContent = `Editar ${label}`;
    
    const modal = new bootstrap.Modal(document.getElementById('editarModal'));
    modal.show();
}

document.getElementById('formEditar').addEventListener('submit', function (e) {
    e.preventDefault();

    const campoId = document.getElementById('campoAtual').value;
    const novoValor = document.getElementById('novoValor').value;

    document.getElementById(campoId).textContent = novoValor;


    const modalElement = bootstrap.Modal.getInstance(document.getElementById('editarModal'));
    modalElement.hide();
});
