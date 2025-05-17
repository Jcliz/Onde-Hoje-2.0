import { showToast } from "../../../components/toast.js";

sessionDataGlobal = null;

async function avaliar() {
    try {
        const evento = document.getElementById('evento').value;
        const nota = document.querySelector('input[name="nota"]:checked').value;
        const comentario = document.getElementById('comentario').value;

        if (!evento || !nota) {
            showToast("Atenção", "Por favor, preencha todos os campos obrigatórios.", "error");
            return;
        }

        const response = await fetch("/api/usuarios/avaliarEvento", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nota, comentario, evento })
        });

        if (response.ok) {
            showToast("Sucesso", "Avaliação enviada com sucesso!", "success");
            location.reload();
        } else {
            showToast("Erro ao enviar avaliação. Tente novamente mais tarde.", "error");
        }
    } catch (error) {
        console.error("Erro ao enviar avaliação:", error);
        showToast("Erro ao enviar avaliação. Tente novamente mais tarde.", "error");
    }
}

async function carregarDados() {
    try {
        const response = await fetch("/api/session");
        const sessionData = await response.json();
        sessionDataGlobal = sessionData;

        if (!sessionData.estaAutenticado) {
            showToast("Atenção, você não está autenticado. Redirecionando para a página de login.", "error");
            window.location.href = "/src/pages/login/login.html";
            return;
        }
    } catch (error) {
        console.error("Erro ao verificar sessão:", error);
    }
}

//buscar e renderizar os estabelecimentos
async function carregarEventos() {
    try {
        const response = await fetch("/api/eventos");
        const eventos = await response.json();
        const container = document.getElementById('lista-eventos');
        const container2 = document.getElementById('listas-eventos');
        container.innerHTML = '';
        container2.innerHTML = '';

        const avaliacao = `
    <div class="text-warning ms-2">
        <div class="star-placeholder">
            <i class="bi bi-star-fill"></i>
            <i class="bi bi-star-fill"></i>
            <i class="bi bi-star-fill"></i>
            <i class="bi bi-star-fill"></i>
            <i class="bi bi-star"></i>
        </div>
        <div class="text-white small fst-italic mt-1">
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante."
        </div>
    </div>
`;


        eventos.forEach(evento => {
            //usando foto do banco se disponível, senão placeholder
            const card = document.createElement('div');
            card.className = "evento-card shadow OH-dark text-center";
            card.onclick = () => selecionarEvento(evento.nome);
            card.innerHTML = `
                <h6 class="mb-0 w-50">${evento.nome}</h6>
                ${avaliacao}
            `;

             const card2 = document.createElement('div');
            card2.className = "evento-card shadow OH-dark text-center";
            card2.onclick = () => selecionarEvento(evento.nome);
            card2.innerHTML = `
                <h6 class="mb-0">${evento.nome}</h6>
            `;

            container.appendChild(card);
            container2.appendChild(card2);
        });
    } catch (error) {
        console.error("Erro ao carregar estabelecimentos:", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await carregarDados();
    carregarEventos();
});

function selecionarEvento(nome) {
    document.getElementById('evento').value = nome;
}