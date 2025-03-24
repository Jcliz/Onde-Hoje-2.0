document.addEventListener("DOMContentLoaded", function () {
    fetch("../components/icons.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("icons-container").innerHTML = data;
        })
        .catch(error => console.error("Erro ao carregar os ícones:", error));
});