document.addEventListener("DOMContentLoaded", function () {
    fetch("/components/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-container").innerHTML = data;

            // Inicialize o comportamento do Bootstrap após carregar o header
            const navbarTogglers = document.querySelectorAll(".navbar-toggler");
            navbarTogglers.forEach(toggler => {
                toggler.addEventListener("click", function () {
                    const target = document.querySelector(this.getAttribute("data-bs-target"));
                    if (target) {
                        target.classList.toggle("show");
                    }
                });
            });
        })
        .catch(error => console.error("Erro ao carregar o header:", error));
});
