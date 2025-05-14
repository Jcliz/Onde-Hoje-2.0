document.addEventListener("DOMContentLoaded", function () {
    // Carregar o conteúdo do header
    fetch("/components/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-container").innerHTML = data;

            // Reatribuir eventos após injetar o HTML do header
            const navbarTogglers = document.querySelectorAll(".navbar-toggler");
            navbarTogglers.forEach(toggler => {
                toggler.addEventListener("click", function () {
                    const target = document.querySelector(this.getAttribute("data-bs-target"));
                    if (target) {
                        target.classList.toggle("show");
                    }
                });
            });

            // Verificação do status de autenticação do usuário
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

            // 🔍 Lógica de mostrar/ocultar a search bar
            const toggle = document.getElementById("searchToggle");
            const formContainer = document.getElementById("searchFormContainer");

            toggle.addEventListener("click", function (e) {
                e.preventDefault();
                
                // Alterna entre mostrar e esconder a search bar
                formContainer.classList.toggle("d-none");
                document.documentElement.classList.add("search-active"); // Aplica o efeito de desfoque
                formContainer.style.display = 'block'; // Garante que o campo de busca será visível

                const input = formContainer.querySelector("input");
                if (!formContainer.classList.contains("d-none")) {
                    input.focus();
                }
            });

            // Fecha ao clicar fora da search bar
            document.addEventListener("click", function (e) {
                if (!formContainer.contains(e.target) && !toggle.contains(e.target)) {
                    formContainer.classList.add("d-none");
                    document.documentElement.classList.remove("search-active"); // Remove o efeito de desfoque
                }
            });

            // Fecha com ESC e remove o desfoque
            document.addEventListener("keydown", function (e) {
                if (e.key === "Escape") {
                    formContainer.classList.add("d-none");
                    document.documentElement.classList.remove("search-active"); // Remove o efeito de desfoque
                }
            });
        })
        .catch(error => console.error("Erro ao carregar o header:", error));
});

document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            // Remove 'active' de todos
            document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(el => el.classList.remove('active'));
            // Adiciona 'active' ao clicado
            item.classList.add('active');
        });
    });