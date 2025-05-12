sessionDataGlobal = null;

async function carregarDados() {
    try {
        const response = await fetch("/api/session");
        const sessionData = await response.json();
        sessionDataGlobal = sessionData;

        if (!sessionData.estaAutenticado) {
            showModal("Atenção", "Você não está autenticado. Redirecionando para a página de login.");
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