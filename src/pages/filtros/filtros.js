// Função para obter parâmetros da URL
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Obter o termo de pesquisa da URL
const searchTerm = getQueryParam('q') || '';

// Atualizar o elemento HTML com o termo pesquisado
document.addEventListener('DOMContentLoaded', () => {
    // Atualizar o elemento HTML com o termo pesquisado
    const resultsElement = document.querySelector('.results h3 em');
    if (resultsElement) {
        resultsElement.textContent = searchTerm || 'todos os itens';
    }

    // Selecionar elementos do filtro
    const categoriaSelect = document.getElementById('categoria');
    const avaliacaoSelect = document.getElementById('avaliacao');
    const ordenacaoSelect = document.getElementById('ordenacao');
    const aplicarBotao = document.getElementById('aplicar-filtros');

    // Carregar resultados iniciais
    loadResults();

    // Adicionar evento ao botão de aplicar filtros
    aplicarBotao.addEventListener('click', loadResults);

    // Evento para quando a categoria mudar
    categoriaSelect.addEventListener('change', function () {
        // Se a categoria for "Evento", desabilitar filtro de avaliação
        if (this.value === 'Evento') {
            avaliacaoSelect.disabled = true;
            avaliacaoSelect.value = 'Qualquer';
        } else {
            avaliacaoSelect.disabled = false;
        }
    });
});

// Função para criar um card utilizando Bootstrap
function createCard(item) {
    const colDiv = document.createElement('div');
    colDiv.className = 'col';

    const cardDiv = document.createElement('div');
    cardDiv.className = 'card h-100 OH-dark text-white';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const cardTitle = document.createElement('h5');
    cardTitle.className = 'card-title';

    const cardText = document.createElement('p');
    cardText.className = 'card-text';

    // Configurar card com base no tipo
    if (item.tipo === 'evento') {
        cardTitle.textContent = `Evento: ${item.nome}`;
        cardText.innerHTML = `
            Data: ${item.data}<br>
            Hora: ${item.hora}<br>
            Endereço: ${item.endereco}
        `;
    } else if (item.tipo === 'avaliacao') {
        cardTitle.textContent = `Estabelecimento: ${item.estabelecimento_nome}`;

        // Criar estrelas baseadas na avaliação
        const estrelas = '⭐'.repeat(item.avaliacao);

        cardText.innerHTML = `
            Avaliação: ${estrelas} (${item.avaliacao})<br>
            Comentário: ${item.comentario || 'Sem comentário'}
        `;
    }

    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardText);
    cardDiv.appendChild(cardBody);
    colDiv.appendChild(cardDiv);

    return colDiv;
}

// Função para buscar os dados do backend e atualizar os cards com filtros aplicados
async function loadResults() {
    try {
        // Obter valores dos filtros
        const categoria = document.getElementById('categoria').value;
        const avaliacao = document.getElementById('avaliacao').value;
        const ordenacao = document.getElementById('ordenacao').value;

        // Construir URL com parâmetros de filtro
        const url = `/api/filtros/avancado?q=${encodeURIComponent(searchTerm)}&categoria=${encodeURIComponent(categoria)}&avaliacao=${encodeURIComponent(avaliacao)}&ordenacao=${encodeURIComponent(ordenacao)}`;

        // Exibir mensagem de carregamento
        const cardsContainer = document.querySelector('.results .row');
        cardsContainer.innerHTML = '<div class="col-12 text-center"><p>Carregando resultados...</p></div>';

        const response = await fetch(url);
        const data = await response.json();

        // Limpar container
        cardsContainer.innerHTML = '';

        // Combinar eventos e avaliações em uma única lista
        const todosResultados = [...data.eventos, ...data.avaliacoes];

        if (todosResultados.length === 0) {
            cardsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p>Nenhum resultado encontrado para "${searchTerm || 'sua pesquisa'}" com os filtros selecionados.</p>
                    <p>Tente ajustar os filtros ou fazer uma nova pesquisa.</p>
                </div>`;
            return;
        }

        // Adicionar cada resultado ao container
        todosResultados.forEach(item => {
            cardsContainer.appendChild(createCard(item));
        });

    } catch (err) {
        console.error('Erro ao carregar resultados:', err);
        const cardsContainer = document.querySelector('.results .row');
        cardsContainer.innerHTML = '<div class="col-12 text-center"><p>Erro ao carregar resultados. Tente novamente.</p></div>';
    }
}
