import { showToast } from "../../../components/toast.js";

async function carregarDados() {
  try {
    const response = await fetch("/api/session");
    const sessionData = await response.json();

    if (!sessionData.estaAutenticado) {
      document.body.classList.add('unauthenticated');
      showToast("Atenção, você não está autenticado. Redirecionando para a página de login.", 'error');
      setTimeout(() => {
        window.location.href = "/src/pages/login/login.html";
      }, 2000);
      return;
    }
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
  }
}

document.getElementById('localEvento').addEventListener('change', function () {
  const selected = this.value;
  const addressFields = document.getElementById('address-fields');
  const estabContainer = document.getElementById('estabelecimentos-container');

  if (selected === 'estabelecimento') {
    addressFields.classList.add('d-none');
    estabContainer.classList.remove('d-none');
    // Desabilita os inputs de endereço para que não sejam validados
    addressFields.querySelectorAll('input').forEach(input => {
      input.disabled = true;
    });
    carregarEstabelecimentos();
  } else {
    addressFields.classList.remove('d-none');
    estabContainer.classList.add('d-none');
    // Habilita os inputs novamente
    addressFields.querySelectorAll('input').forEach(input => {
      input.disabled = false;
    });
  }
});

async function carregarEstabelecimentos() {
  try {
    const response = await fetch("/api/estabelecimentos");
    const estabelecimentos = await response.json();
    const container = document.getElementById('estabelecimentos-container');
    container.innerHTML = '';

    estabelecimentos.forEach(estab => {
      const fotoUrl = estab.foto
        ? `/api/estabelecimentos/foto/${estab.ID_estabelecimento}?${Date.now()}`
        : '../../../public/cafe.png';

      // Cria um label que encapsula o input radio e os dados do estabelecimento
      const card = document.createElement('label');
      card.className = "estabelecimento-card shadow OH-dark text-center p-2";
      card.style.cursor = "pointer";
      card.innerHTML = `
                <input type="radio" name="estabelecimento" value="${estab.nome}" class="d-none">
                <img src="${fotoUrl}" alt="${estab.nome}" class="img-fluid rounded mb-1" style="max-height:80px" />
                <h6 class="mb-0">${estab.nome}</h6>
            `;

      card.addEventListener('click', () => {
        // Define o input radio como selecionado
        const radio = card.querySelector('input');
        radio.checked = true;
        // Remove a seleção visual de todos os outros cards
        container.querySelectorAll('.estabelecimento-card').forEach(c => {
          c.classList.remove("border", "border-2", "border-white", "selected");
        });
        // Aplica o destaque no card selecionado
        card.classList.add("border", "border-2", "border-white", "selected");
      });

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao carregar estabelecimentos:", error);
  }
}

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

async function criarEvento() {
  if (document.querySelector('.is-invalid')) {
    showToast("Existem campos inválidos. Por favor, corrija-os.", "error");
    return;
  }

  const localEvento = document.getElementById('localEvento').value;
  let fk_ID_estabelecimento = null;
  if (localEvento === 'estabelecimento') {
    const estabSelected = document.querySelector('input[name="estabelecimento"]:checked');
    if (!estabSelected) {
      showToast("Selecione um estabelecimento.", "error");
      return;
    }
    // Envia o nome do estabelecimento para que o backend o busque
    fk_ID_estabelecimento = estabSelected.value;
  }

  const dateInputValue = document.getElementById('data').value;
  const timeInputValue = document.getElementById('horario').value;

  if (!dateInputValue || !timeInputValue) {
    showToast("Preencha a data e o horário.", "error");
    return;
  }

  const eventDateTime = new Date(dateInputValue + 'T' + timeInputValue);
  const now = new Date();
  const nowPlusOneHour = new Date(now.getTime() + 3600000);

  if (eventDateTime < now) {
    showToast("A data escolhida já passou. Selecione uma data futura.", "error");
    return;
  }

  if (eventDateTime < nowPlusOneHour) {
    showToast("O horário deve ser pelo menos 1 hora no futuro.", "error");
    return;
  }

  // Coleta os demais campos de evento
  const nome = document.getElementById('nome').value;
  const cep = document.getElementById('cep').value;
  const rua = document.getElementById('rua').value;
  const bairro = document.getElementById('bairro').value;
  const numero = document.getElementById('numero').value;
  const fotoInput = document.getElementById('foto');

  const formData = new FormData();
  formData.append('nome', nome);
  formData.append('data', dateInputValue);
  formData.append('hora', timeInputValue);
  formData.append('cep', cep);
  formData.append('rua', rua);
  formData.append('bairro', bairro);
  formData.append('numero', numero);

  //só adiciona fk_ID_estabelecimento se a opção for estabelecimento
  if (localEvento === 'estabelecimento') {
    formData.append('fk_ID_estabelecimento', fk_ID_estabelecimento);
  }

  if (fotoInput && fotoInput.files.length > 0) {
    formData.append('foto', fotoInput.files[0]);
  }

  try {
    const response = await fetch("/api/eventos/criar", {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    if (response.ok) {
      showToast(result.message, "success");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      showToast(result.message || "Erro ao criar evento.", "error");
    }
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    showToast("Erro ao criar evento.", "error");
  }
}

async function carregarEventosAtivos() {
  try {
    const response = await fetch('/api/eventos/ativos');
    const eventos = await response.json();
    const container = document.getElementById('eventos-container');
    container.innerHTML = '';

    eventos.forEach(evento => {
      // Define o local: se houver CEP, monta o endereço; senão, usa o nome do estabelecimento
      let localText = '';
      if (evento.cep) {
        localText = `${evento.cep} - ${evento.rua}, ${evento.bairro}, Nº ${evento.numero}`;
      } else {
        localText = evento.estabelecimento_nome || 'Local não definido';
      }

      // Formata a data para o padrão pt-BR
      const dataFormat = new Date(evento.data).toLocaleDateString('pt-BR');

      // Cria o card do evento
      const card = document.createElement('div');
      card.className = "list-group-item OH-dark text-white d-flex justify-content-between align-items-center rounded mb-2 shadow-sm";
      card.style.cursor = "pointer";
      card.innerHTML = `
        <div>
          <i class="bi bi-calendar-event me-2 text-white"></i>
          <strong>${evento.nome}</strong>
          <div class="small text-white">${dataFormat} - ${evento.hora}</div>
          <div class="small text-white">${localText}</div>
        </div>
        <i class="bi bi-chevron-right text-secondary"></i>
      `;

      // Ao clicar, preenche o modal com os detalhes do evento e exibe a foto
      card.addEventListener('click', () => {
        document.getElementById('eventoNome').textContent = evento.nome;
        document.getElementById('eventoData').textContent = dataFormat;
        document.getElementById('eventoHorario').textContent = evento.hora;
        document.getElementById('eventoLocal').textContent = localText;
        const eventoFotoEl = document.getElementById('eventoFoto');
        eventoFotoEl.src = `/api/eventos/foto/${evento.ID_evento}?${Date.now()}`;

        eventoFotoEl.onerror = () => {
          eventoFotoEl.src = '../../../bar.png';
        };

        // Abre o modal utilizando a API do Bootstrap
        const modal = new bootstrap.Modal(document.getElementById('modalEvento'));
        modal.show();
      });

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao carregar eventos ativos:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await carregarDados();
  carregarEventosAtivos();
});

window.criarEvento = criarEvento;