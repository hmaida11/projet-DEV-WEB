function showBox(boxId) {
    document.querySelectorAll('.auth-form').forEach(box => {
        box.style.opacity = '0';
        setTimeout(() => box.classList.remove('active'), 200);
    });
    
    setTimeout(() => {
        const activeBox = document.getElementById(boxId);
        activeBox.classList.add('active');
        activeBox.style.opacity = '1';
    }, 250);
}

function toggleCodeField() {
    const type = document.getElementById('user_type').value;
    const codeField = document.getElementById('code_field');
    const payNotice = document.getElementById('pay-notice');
    
    if (type === 'interne') {
        codeField.style.display = 'block';
        payNotice.style.display = 'none';
        codeField.setAttribute('required', 'true');
    } else {
        codeField.style.display = 'none';
        payNotice.style.display = 'block';
        codeField.removeAttribute('required');
    }
}
// Variable pour savoir si le paiement est fait
let isPaid = false;

function toggleCodeField() {
    const type = document.getElementById('user_type').value;
    const btn = document.querySelector('#register-box button');
    
    if (type === 'interne') {
        document.getElementById('code_field').style.display = 'block';
        btn.innerText = "S'inscrire gratuitement";
    } else {
        document.getElementById('code_field').style.display = 'none';
        btn.innerText = "Procéder au paiement (9.99€)";
    }
}

// Intercepter la soumission du formulaire d'inscription
document.querySelector('#register-box form').onsubmit = function(e) {
    const type = document.getElementById('user_type').value;
    
    // Si c'est un étranger et qu'il n'a pas encore payé
    if (type === 'etranger' && !isPaid) {
        e.preventDefault(); // On bloque l'envoi au PHP
        document.getElementById('payment-modal').style.display = 'block';
    }
    // Sinon (Interne ou Étranger déjà payé), le formulaire part vers auth.php
};

function processPayment() {
    const status = document.getElementById('pay-status');
    status.innerHTML = '<div class="loading-spinner"></div> Vérification...';
    
    // Simulation d'une attente bancaire de 2 secondes
    setTimeout(() => {
        isPaid = true;
        status.style.color = "#2ecc71";
        status.innerText = "✅ Paiement Accepté !";
        
        setTimeout(() => {
            closePayment();
            // On clique automatiquement sur le bouton d'inscription pour l'utilisateur
            document.querySelector('#register-box form').submit();
        }, 1000);
    }, 2000);
}

function closePayment() {
    document.getElementById('payment-modal').style.display = 'none';
}