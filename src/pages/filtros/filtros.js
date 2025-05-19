// Função para obter parâmetros da URL
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Obter o termo de pesquisa da URL
const searchTerm = getQueryParam('q');

// Atualizar o elemento HTML com o termo pesquisado
if (searchTerm) {
    const resultsElement = document.querySelector('.results em');
    if (resultsElement) {
        resultsElement.textContent = searchTerm;
    }
}
