//verificação de CEP e auto completamento
async function validarCEP(input) {
    const rua = document.querySelector('#rua');
    const bairro = document.querySelector('#bairro');

    const onlyNumbers = /^[0-9]+$/;
    const cepValid = /^[0-9]{8}$/;

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