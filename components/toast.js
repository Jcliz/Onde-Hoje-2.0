export function showToast(message, type = 'error') {
    const toastEl = document.getElementById('toast-alert');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;

    // Define cor com base no tipo
    let bgColor;
    switch (type) {
        case 'success':
            bgColor = 'success'; // Verde
            break;
        case 'error':
        default:
            bgColor = 'danger'; // Vermelho
            break;
    }

    toastEl.className = `toast align-items-center text-white bg-${bgColor} border-0`;

    const bsToast = new bootstrap.Toast(toastEl);
    bsToast.show();
}

