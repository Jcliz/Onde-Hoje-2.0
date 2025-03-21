document.addEventListener("DOMContentLoaded", function () {
    fetch("../Componentes/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-container").innerHTML = data;
        })
        .catch(error => console.error("Erro ao carregar o header:", error));
});
