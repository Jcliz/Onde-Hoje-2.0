document.addEventListener("DOMContentLoaded", function () {
    fetch("/components/footer.html") // Ajuste o caminho aqui
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer-container").innerHTML = data;
        })
        .catch(error => console.error("Erro ao carregar o footer:", error));
});
