document.addEventListener("DOMContentLoaded", function () {
    fetch("../Componentes/sidebar.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("sidebar-container").innerHTML = data;
        })
        .catch(error => console.error("Erro ao carregar a sidebar:", error));
});
