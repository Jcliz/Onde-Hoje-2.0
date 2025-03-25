document.addEventListener("DOMContentLoaded", function () {
    fetch("/components/header.html") // Ajuste o caminho aqui
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-container").innerHTML = data;
        })
        .catch(error => console.error("Erro ao carregar o header:", error));
});
