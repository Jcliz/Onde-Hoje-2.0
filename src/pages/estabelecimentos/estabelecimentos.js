const modal = document.getElementById('modal');
const form = document.getElementById('addProductForm');
const productTableBody = document.getElementById('productTableBody');
let currentEditingRow = null;

// Função para abrir o modal
function openModal() {
    modal.showModal(); // Exibe o modal
}

// Função para fechar o modal
function closeModal() {
    modal.close(); // Fecha o modal
    form.reset(); // Reseta o formulário
    currentEditingRow = null; // Reseta a linha de edição
}

// Função para salvar ou atualizar os dados do formulário
async function salvar(event) {
    event.preventDefault();

    const productName = document.getElementById('productName').value;
    const productCode = document.getElementById('productCode').value;
    const productPrice = document.getElementById('productPrice').value;

    const data = {
        nome: productName,
        endereco: productCode,
        avaliacao: parseFloat(productPrice)
    };

    let url = 'http://localhost:3000/api/estabelecimentos';
    let method = 'POST';

    // Se estiver editando, envie uma requisição PUT para atualizar o item
    if (currentEditingRow) {
        const id = currentEditingRow.dataset.id;
        url = `${url}/${id}`;
        method = 'PUT';
    }

    // Enviar os dados para o servidor
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
        // Atualizar a tabela com os dados atualizados
        listar();
        closeModal(); // Fecha o modal após salvar
    } else {
        console.error('Erro ao salvar:', result);
    }
}

// Função para listar os estabelecimentos e atualizar a tabela
async function listar() {
    const response = await fetch('http://localhost:3000/api/estabelecimentos', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const result = await response.json();

    // Limpar a tabela antes de preencher novamente
    productTableBody.innerHTML = '';

    // Preencher a tabela com os dados obtidos
    result.forEach(estabelecimento => {
        const newRow = document.createElement('tr');
        newRow.dataset.id = estabelecimento.id;
        newRow.innerHTML = `
            <td style="width: 140px;">
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" onchange="statusProduct(this)">
                    <label class="form-check-label" style="margin-left: 15%; color: white !important;">Inativo</label>
                </div>
            </td>
            <td style="text-align: center !important; color: white !important;">${estabelecimento.nome}</td>
            <td style="text-align: center !important; color: white !important;">${estabelecimento.endereco}</td>
            <td style="text-align: center !important; color: white !important;">${estabelecimento.avaliacao.toFixed(2)}</td>
            <td style="text-align: center !important">
                <div class="btn-group">
                    <button class="btn btn-warning btn-sm" onclick="editProduct(this)">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(this)">Excluir</button>
                </div>
            </td>
        `;
        productTableBody.appendChild(newRow);
    });
}

// Função para editar um estabelecimento
function editProduct(button) {
    const row = button.closest('tr');
    document.getElementById('productName').value = row.cells[1].textContent;
    document.getElementById('productCode').value = row.cells[2].textContent;
    document.getElementById('productPrice').value = row.cells[3].textContent;
    currentEditingRow = row;
    openModal(); // Abre o modal para editar
}

// Função para excluir um estabelecimento
async function deleteProduct(button) {
    if (confirm('Tem certeza de que deseja excluir este produto?')) {
        const row = button.closest('tr');
        const id = row.dataset.id;

        const response = await fetch(`http://localhost:3000/api/estabelecimentos/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            row.remove();
        } else {
            console.error('Erro ao excluir');
        }
    }
}

// Função para atualizar o status do produto
function statusProduct(input) {
    const label = input.nextElementSibling;
    label.textContent = input.checked ? "Ativo" : "Inativo";
}

// Eventos de inicialização
form.addEventListener('submit', salvar);
document.addEventListener('DOMContentLoaded', listar);

var menuButton = document.getElementById("menu-button");
var menu = document.getElementById("menu");
var content = document.getElementById("content");

menuButton.addEventListener("click", function() {
    if (menu.classList.contains("menu-show")) {
        menu.classList.remove("menu-show");
        menu.classList.add("menu-hide");
        content.classList.add("content-expanded");
    } else {
        menu.classList.remove("menu-hide");
        menu.classList.add("menu-show");
        content.classList.remove("content-expanded");
    }
});