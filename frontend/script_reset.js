function showAlert(elementId, message, type = "error") {
    const alertDiv = document.getElementById(elementId);
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.classList.remove("hidden");
    // Ne pas masquer automatiquement si c'est un succès pour laisser le temps de lire
    if (type === "error") {
        setTimeout(() => alertDiv.classList.add("hidden"), 5000);
    }
}

document.getElementById("form-reset").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("reset-email").value;
    const password = document.getElementById("reset-pass").value;
    const confirm = document.getElementById("reset-pass-confirm").value;

    if (!email || !password || !confirm) {
        return showAlert("reset-alert", "Tous les champs sont requis");
    }

    if (password !== confirm) {
        return showAlert("reset-alert", "Les mots de passe ne correspondent pas");
    }

    if (password.length < 6) {
        return showAlert("reset-alert", "6 caractères minimum requis");
    }

    try {
        const res = await fetch("http://localhost:3000/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
            showAlert("reset-alert", "Mot de passe mis à jour ! Redirection...", "success");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 3000);
        } else {
            showAlert("reset-alert", data.error || "Une erreur est survenue");
        }
    } catch (error) {
        showAlert("reset-alert", "Erreur de connexion au serveur");
    }
});
