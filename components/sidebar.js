fetch("/components/sidebar.html") // Ajustado para um caminho consistente
        .then(response => {
            if (!response.ok) throw new Error("Erro ao carregar a sidebar.");
            return response.text();
        })
        .then(data => {
            document.getElementById("sidebar-container").innerHTML = data;
            console.log("Sidebar carregada com sucesso.");
        })
        .catch(error => console.error(error));