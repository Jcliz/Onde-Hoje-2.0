import { showToast } from "../../../components/toast.js";

async function carregarDados() {
    try {
        const response = await fetch("/api/session");
        const sessionData = await response.json();

        if (!sessionData.estaAutenticado || !sessionData.isAdm) {
            if (!sessionData.estaAutenticado) {
                window.location.href = "/src/pages/login/login.html";
                return;
            } else {
                window.location.href = "/src/pages/telaEntrada/telaentrada.html";
                return;
            }
        }
    } catch (error) {
        console.error("Erro ao verificar sessão:", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await carregarDados();

    const fotoInput = document.getElementById('foto');
    const fotoLabel = document.querySelector('label[for="foto"]');
    // Armazena o HTML original do botão de selecionar a foto
    const originalLabelHTML = fotoLabel.innerHTML;

    fotoInput.addEventListener('change', function () {
        if (this.files.length > 0) {
            fotoLabel.innerHTML = `<i class="bi bi-check-circle me-2" style="font-size: 1.5rem; color: green;"></i> Upload realizado!`;
            fotoInput.disabled = true;
            fotoLabel.style.pointerEvents = 'none';

            // Cria o elemento que permitirá trocar a foto com o ícone X em vermelho
            const trocarFotoEl = document.createElement('div');
            trocarFotoEl.innerHTML = `<span style="cursor: pointer;"><i class="bi bi-x-circle me-2" style="font-size: 1.5rem; color: red;"></i> Trocar de foto</span>`;

            trocarFotoEl.addEventListener("click", () => {
                document.getElementById('modalEstab').setAttribute('data-id', estabelecimento.ID_estabelecimento);

                // Restaura o input
                fotoInput.disabled = false;
                fotoInput.value = "";
                fotoLabel.innerHTML = originalLabelHTML;
                fotoLabel.style.pointerEvents = '';
                trocarFotoEl.remove();
            });
            fotoLabel.parentNode.insertBefore(trocarFotoEl, fotoLabel.nextSibling);
        }
    });
});

async function excluirEstabelecimento() {
    const id = document.getElementById('modalEstab').getAttribute('data-id');

    if (!id) return;

    if (confirm("Tem certeza que deseja excluir este estabelecimento?")) {
        try {
            const response = await fetch(`/api/estabelecimentos/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                showToast("Estabelecimento excluído com sucesso!", 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalEstab'));
                modal.hide();
                carregarEstabAtivos();
            } else {
                showToast("Erro ao excluir o estabelecimento.", 'error');
            }
        } catch (error) {
            console.error("Erro ao excluir:", error);
            showToast("Erro ao excluir. Tente novamente mais tarde.", 'error');
        }
    }
}

async function atualizarEstabelecimento() {
    const id = document.getElementById('modalEstab').getAttribute('data-id');
    const novoNome = prompt("Digite o novo nome do estabelecimento:");

    if (!novoNome || !id) return;

    try {
        const response = await fetch(`/api/estabelecimentos/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nome: novoNome }),
        });

        if (response.ok) {
            showToast("Estabelecimento atualizado com sucesso!", 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalEstab'));
            modal.hide();
            carregarEstabAtivos();
        } else {
            showToast("Erro ao atualizar estabelecimento.", 'error');
        }
    } catch (error) {
        console.error("Erro ao atualizar:", error);
        showToast("Erro ao atualizar. Tente novamente mais tarde.", 'error');
    }
}


async function criar() {
    const nome = document.getElementById('nome').value;
    const cnpj = document.getElementById('cnpj').value;
    const cep = document.getElementById('cep').value;
    const rua = document.getElementById('rua').value;
    const bairro = document.getElementById('bairro').value;
    const numero = document.getElementById('numero').value;
    const fotoInput = document.getElementById('foto');

    const invalidFields = document.querySelectorAll('.is-invalid');
    if (invalidFields.length > 0) {
        showToast("Atenção: Corrija os erros no formulário.", 'error');
        return;
    }

    if (!nome || !cnpj || !cep || !rua || !numero || !bairro) {
        showToast("Atenção: Por favor, preencha todos os campos obrigatórios.", 'error');
        return;
    }

    // Cria um FormData para enviar os dados, semelhante à função uploadFoto
    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("cnpj", cnpj);
    formData.append("cep", cep);
    formData.append("rua", rua);
    formData.append("bairro", bairro);
    formData.append("numero", numero);
    if (fotoInput.files.length > 0) {
        formData.append("foto", fotoInput.files[0]);
    }

    try {
        const response = await fetch("/api/estabelecimentos/criar", {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            showToast("Estabelecimento cadastrado com sucesso!", 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else if (response.status === 400) {
            const data = await response.json();
            showToast("Foto inválida.", 'error');
            return;
        } else {
            showToast("Erro ao cadastrar estabelecimento", 'error');
        }
    } catch (error) {
        console.error("Erro ao enviar o cadastro:", error);
        showToast("Erro ao cadastrar. Tente novamente mais tarde.", 'error');
    }
}

//verificação de CEP e auto completamento
async function validarCEP(input) {
    const rua = document.querySelector('#rua');
    const bairro = document.querySelector('#bairro');

    const onlyNumbers = /^[0-9]+$/;

    try {
        if (!onlyNumbers.test(input.value)) {
            throw { cep_error: 'CEP inválido.' };
        }

        const response = await fetch(`https://viacep.com.br/ws/${input.value}/json/`);

        if (!response.ok) {
            throw await response.json();
        }

        const responseCep = await response.json();

        if (responseCep.erro) {
            throw { cep_error: 'CEP não encontrado.' };
        }

        rua.value = responseCep.logradouro;
        bairro.value = `${responseCep.bairro} | ${responseCep.localidade} - ${responseCep.uf}`;

        input.classList.remove('is-invalid');
        input.value = input.value.replace(/(\d{5})(\d{3})/, '$1-$2');

    } catch (error) {
        if (error?.cep_error) {
            input.classList.add('is-invalid');
        }
    }
}

//apenas números no campo de CEP
document.querySelectorAll('#cep').forEach(cepInput => {
    cepInput.addEventListener('input', () => {
        cepInput.value = cepInput.value.replace(/\D/g, '');
    });

    cepInput.addEventListener('focusout', () => {
        validarCEP(cepInput);
    });
});

function validarNome(input) {
    const nomeValid = /^[a-zA-ZÀ-ú]+\s[a-zA-ZÀ-ú\s]+$/;

    if (input.value.length < 3 || input.value.length > 50) {
        input.classList.add('is-invalid');
        return false;

    } else if (nomeValid.test(input.value)) {
        input.classList.remove('is-invalid');
        return true;

    } else {
        input.classList.add('is-invalid');
        return false;

    }
}

document.querySelectorAll('#nome').forEach(nameInput => {
    nameInput.addEventListener('input', () => {
        nameInput.value = nameInput.value.replace(/[^a-zA-ZÀ-ú\s]/g, '');
    });
});

document.getElementById('nome').addEventListener('focusout', function () {
    validarNome(this);
});

document.getElementById('cnpj').addEventListener('focusout', function () {
    let value = this.value.replace(/\D/g, '');
    if (value.length > 14) {
        value = value.slice(0, 14);
    }
    this.value = value.replace(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})$/, (match, g1, g2, g3, g4, g5) => {
        let formatted = g1;
        if (g2) formatted += '.' + g2;
        if (g3) formatted += '.' + g3;
        if (g4) formatted += '/' + g4;
        if (g5) formatted += '-' + g5;
        return formatted;
    });
});

async function carregarEstabAtivos() {
    try {
        const response = await fetch('/api/estabelecimentos/ativos');
        const estab = await response.json();
        const container = document.getElementById('estab-container');
        container.innerHTML = '';

        estab.forEach(estabelecimento => {
            // Define o local: se houver CEP, monta o endereço; senão, usa o nome do estabelecimento
            let localText = '';
            if (estabelecimento.cep) {
                localText = `${estabelecimento.cep} - ${estabelecimento.rua}, ${estabelecimento.bairro}, Nº ${estabelecimento.numero}`;
            } else {
                localText = estabelecimento.nome || 'Local não definido';
            }

            // Cria o card do evento
            const card = document.createElement('div');
            card.className = "list-group-item OH-dark text-white d-flex justify-content-between align-items-center rounded mb-2 shadow-sm";
            card.style.cursor = "pointer";
            card.innerHTML = `
        <div>
          <i class="bi bi-calendar-event me-2 text-white"></i>
          <strong>${estabelecimento.nome}</strong>
          <div class="small text-white">${localText}</div>
        </div>
        <i class="bi bi-chevron-right text-secondary"></i>
      `;

            // Ao clicar, preenche o modal com os detalhes do evento e exibe a foto
            card.addEventListener('click', () => {
                document.getElementById('estabelecimentoNome').textContent = estabelecimento.nome;
                document.getElementById('estabelecimentoLocal').textContent = localText;
                const estabelecimentoFotoEl = document.getElementById('estabelecimentoFoto');
                estabelecimentoFotoEl.src = `/api/estabelecimento/foto/${estabelecimento.ID_estabelecimento}?${Date.now()}`;

                estabelecimentoFotoEl.onerror = () => {
                    estabelecimentoFotoEl.src = '../../../bar.png';
                };

                // Abre o modal utilizando a API do Bootstrap
                const modal = new bootstrap.Modal(document.getElementById('modalEstab'));
                document.getElementById('modalEstab').setAttribute('data-id', estabelecimento.ID_estabelecimento);

                modal.show();
            });

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Erro ao carregar eventos ativos:", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById('btnExcluir').addEventListener('click', excluirEstabelecimento);
    document.getElementById('btnAtualizar').addEventListener('click', atualizarEstabelecimento);
    await carregarDados();
    carregarEstabAtivos();
});

window.criar = criar;