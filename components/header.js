document.addEventListener("DOMContentLoaded", function () {
    fetch("/components/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-container").innerHTML = data;
            
            const navbarTogglers = document.querySelectorAll(".navbar-toggler");
            navbarTogglers.forEach(toggler => {
                toggler.addEventListener("click", function () {
                    const target = document.querySelector(this.getAttribute("data-bs-target"));
                    if (target) {
                        target.classList.toggle("show");
                    }
                });
            });

            //verificação do status de autenticação do usuário
            fetch("/api/session")
                .then(response => response.json())
                .then(sessionData => {
                    const userInfo = document.getElementById("user-info");
                    const loginBtn = document.getElementById("login-btn");
                    const signupBtn = document.getElementById("signup-btn");

                    if (sessionData.estaAutenticado) {
                        userInfo.textContent = `Olá, ${sessionData.nomeUsuario}`;
                        userInfo.classList.remove("d-none");
                        loginBtn.classList.add("d-none");
                        signupBtn.classList.add("d-none");
                    }
                })
                .catch(error => console.error("Erro ao verificar sessão:", error));
        })
        .catch(error => console.error("Erro ao carregar o header:", error));
});
