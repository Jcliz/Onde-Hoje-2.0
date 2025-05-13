sessionDataGlobal = null;

async function avaliar() {
    try {
        const estabelecimento = document.getElementById('estabelecimento').value;
        const nota = document.querySelector('input[name="nota"]:checked').value;
        const comentario = document.getElementById('comentario').value;

        if (!estabelecimento || !nota) {
            alert("Atenção", "Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        const response = await fetch("/api/usuarios/avaliar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nota, comentario, estabelecimento })
        });

        if (response.ok) {
            alert("Sucesso", "Avaliação enviada com sucesso!");
            location.reload();
        } else {
            alert("Erro ao enviar avaliação. Tente novamente mais tarde.");
        }
    } catch (error) {
        console.error("Erro ao enviar avaliação:", error);
        alert("Erro ao enviar avaliação. Tente novamente mais tarde.");
    }
}

async function carregarDados() {
    try {
        const response = await fetch("/api/session");
        const sessionData = await response.json();
        sessionDataGlobal = sessionData;

        if (!sessionData.estaAutenticado) {
            alert("Atenção, você não está autenticado. Redirecionando para a página de login.");
            window.location.href = "/src/pages/login/login.html";
            return;
        }
    } catch (error) {
        console.error("Erro ao verificar sessão:", error);
    }
}

//buscar e renderizar os estabelecimentos
async function carregarEstabelecimentos() {
    try {
        const response = await fetch("/api/estabelecimentos");
        const estabelecimentos = await response.json();
        const container = document.getElementById('lista-estabelecimentos');
        container.innerHTML = '';

        estabelecimentos.forEach(estab => {
            //usando foto do banco se disponível, senão placeholder
            const fotoUrl = estab.foto
                ? `/api/estabelecimentos/foto/${estab.ID_estabelecimento}?${Date.now()}`
                : '../../../public/cafe.png';

            const card = document.createElement('div');
            card.className = "estabelecimento-card shadow-sm OH-dark text-center";
            card.onclick = () => selecionarEstabelecimento(estab.nome);
            card.innerHTML = `
                <img src="${fotoUrl}" alt="${estab.nome}" class="img-fluid rounded mb-1" />
                <h6 class="mb-0">${estab.nome}</h6>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Erro ao carregar estabelecimentos:", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await carregarDados();
    carregarEstabelecimentos();
});

function selecionarEstabelecimento(nome) {
    document.getElementById('estabelecimento').value = nome;
}