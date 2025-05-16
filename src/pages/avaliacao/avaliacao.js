sessionDataGlobal = null;

async function avaliar() {
    try {
        const estabelecimento = document.getElementById('estabelecimento').value;
        const notaInput = document.querySelector('input[name="nota"]:checked');

        if (!notaInput) {
            window.alert("Por favor, selecione uma nota.");
            return;
        }
        const nota = notaInput.value;
        const comentario = document.getElementById('comentario').value;

        if (!estabelecimento || !nota) {
            window.alert("Atenção: Por favor, preencha todos os campos obrigatórios.");
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
            window.alert("Avaliação enviada com sucesso!");
            window.location.reload();
        } else {
            window.alert("Erro ao enviar avaliação. Tente novamente mais tarde.");
        }
    } catch (error) {
        console.error("Erro ao enviar avaliação:", error);
        window.alert("Erro ao enviar avaliação. Tente novamente mais tarde.");
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

// Carregar somente os estabelecimentos que já possuem avaliações
async function carregarAvaliacoes() {
    try {
        const responseAval = await fetch("/api/usuarios/avaliacoes");
        const avaliacoes = await responseAval.json();

        const containerAval = document.getElementById('lista-estabelecimentos');
        containerAval.innerHTML = '';

        avaliacoes.forEach(item => {
            let stars = '';
            const rating = Number(item.avaliacao);
            for (let i = 0; i < rating; i++) {
                stars += '<i class="bi bi-star-fill"></i>';
            }
            for (let i = rating; i < 5; i++) {
                stars += '<i class="bi bi-star"></i>';
            }
            const avaliacaoContent = `
                <div class="text-warning ms-2">
                    <div class="star-rating" style="direction: ltr; unicode-bidi: embed;">
                        ${stars}
                    </div>
                    <div class="text-white small fst-italic mt-1">
                        "${item.comentario}"
                    </div>
                </div>
            `;

            const fotoUrl = item.foto
                ? `/api/estabelecimentos/foto/${item.ID_estabelecimento}?${Date.now()}`
                : '../../../public/cafe.png';

            const card = document.createElement('div');
            card.className = "estabelecimento-card shadow OH-dark text-center";
            card.innerHTML = `
                <img src="${fotoUrl}" alt="${item.nome}" class="img-fluid rounded mb-1" />
                <h6 class="mb-0 w-50">${item.nome}</h6>
                ${avaliacaoContent}
            `;
            containerAval.appendChild(card);
        });
    } catch (error) {
        console.error("Erro ao carregar avaliações:", error);
    }
}

// Carregar a lista completa de estabelecimentos
async function carregarEstabelecimentos() {
    try {
        const responseEstab = await fetch("/api/estabelecimentos");
        const estabelecimentos = await responseEstab.json();

        const containerEstab = document.getElementById('listas-estabelecimentos');
        containerEstab.innerHTML = '';

        estabelecimentos.forEach(estab => {
            const fotoUrl = estab.foto
                ? `/api/estabelecimentos/foto/${estab.ID_estabelecimento}?${Date.now()}`
                : '../../../public/cafe.png';

            const card = document.createElement('div');
            card.className = "estabelecimento-card shadow OH-dark text-center";
            card.onclick = () => selecionarEstabelecimento(estab.nome);
            card.innerHTML = `
                <img src="${fotoUrl}" alt="${estab.nome}" class="img-fluid rounded mb-1" />
                <h6 class="mb-0">${estab.nome}</h6>
            `;
            containerEstab.appendChild(card);
        });
    } catch (error) {
        console.error("Erro ao carregar estabelecimentos:", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await carregarDados();
    carregarAvaliacoes();
    carregarEstabelecimentos();
});

function selecionarEstabelecimento(nome) {
    document.getElementById('estabelecimento').value = nome;
}