document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("cadastroForm");

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value.trim();
        const telefone = document.getElementById("telefone").value.trim();
        const idade = document.getElementById("idade").value.trim();
        const estado = document.getElementById("estado").value;
        const termos = document.getElementById("termos").checked;

        if (!nome || !email || !senha || !telefone || !idade || !estado || !termos) {
            alert("Preencha todos os campos e aceite os termos!");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("E-mail inválido!");
            return;
        }

        alert("Cadastro realizado com sucesso!");
        form.submit();
    });
});