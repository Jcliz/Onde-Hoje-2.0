import { showToast } from "../../../components/toast.js";

let sessionDataGlobal = null;
let selectedCard = null;

async function avaliar() {
    try {
        const estabelecimento = document.getElementById('estabelecimento').value;
        const notaInput = document.querySelector('input[name="nota"]:checked');

        if (!notaInput) {
            showToast("Por favor, selecione uma nota.", 'warning');
            return;
        }
        const nota = notaInput.value;
        const comentario = document.getElementById('comentario').value;

        if (!estabelecimento || !nota) {
            showToast("Atenção: Por favor, preencha todos os campos obrigatórios.", 'error');
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
            showToast("Avaliação enviada com sucesso!", 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showToast("Erro ao enviar avaliação. Tente novamente mais tarde.", 'error');
        }
    } catch (error) {
        console.error("Erro ao enviar avaliação:", error);
        showToast("Erro ao enviar avaliação. Tente novamente mais tarde.", 'error');
    }
}

async function carregarDados() {
    try {
        const response = await fetch("/api/session");
        const sessionData = await response.json();
        sessionDataGlobal = sessionData;

        if (!sessionData.estaAutenticado) {
            document.body.classList.add('unauthenticated');
            showToast("Atenção, você não está autenticado. Redirecionando para a página de login.", 'error');
            setTimeout(() => {
                window.location.href = "/src/pages/login/login.html";
            }, 2000);
            return;
        }
    } catch (error) {
        console.error("Erro ao verificar sessão:", error);
    }
}

// Função para atualizar o botão de avaliação
function updateAvaliarButton() {
    const btn = document.getElementById('btnAvaliar');
    const estabelecimento = document.getElementById('estabelecimento').value;
    if (!estabelecimento) {
        btn.disabled = true;
        // Define o botão com background transparente e borda visível
        btn.style.backgroundColor = "transparent";
        btn.style.border = "1px solid white";
        btn.style.color = "white";
    } else {
        btn.disabled = false;
        // Remove os estilos customizados para restaurar as cores padrão
        btn.style.backgroundColor = "";
        btn.style.border = "";
        btn.style.color = "";
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
                    <div class="star-rating list-stars" style="direction: ltr; unicode-bidi: embed;">
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

async function carregarAvaliacoesPessoal() {
    try {
        const responseAval = await fetch("/api/usuarios/avaliacoesPessoais");
        const avaliacoes = await responseAval.json();

        const containerAval = document.getElementById('lista-ava');
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
                    <div class="star-rating list-stars" style="direction: ltr; unicode-bidi: embed;">
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
            card.innerHTML = `
                <img src="${fotoUrl}" alt="${estab.nome}" class="img-fluid rounded mb-1" />
                <h6 class="mb-0">${estab.nome}</h6>
            `;
            card.onclick = function () {
                if (this === selectedCard) {
                    // Desmarcar seleção
                    this.classList.remove("border", "border-2", "border-white");
                    selectedCard = null;
                    document.getElementById('estabelecimento').value = "";
                } else {
                    // Remover seleção anterior, se existir
                    if (selectedCard) {
                        selectedCard.classList.remove("border", "border-2", "border-white");
                    }
                    selectedCard = this;
                    this.classList.add("border", "border-2", "border-white");
                    document.getElementById('estabelecimento').value = estab.nome;
                }
                updateAvaliarButton();
            };

            containerEstab.appendChild(card);
        });
        // Inicializa o estado do botão ao carregar a lista
        updateAvaliarButton();
    } catch (error) {
        console.error("Erro ao carregar estabelecimentos:", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await carregarDados();
    carregarAvaliacoes();
    carregarEstabelecimentos();
    carregarAvaliacoesPessoal();
});

window.avaliar = avaliar;