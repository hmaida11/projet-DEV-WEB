function showLogin() {
  document.getElementById("view-login").classList.remove("hidden");
  document.getElementById("view-register").classList.add("hidden");
  document.getElementById("view-forgot").classList.add("hidden");
}

function showRegister() {
  document.getElementById("view-login").classList.add("hidden");
  document.getElementById("view-register").classList.remove("hidden");
  document.getElementById("view-forgot").classList.add("hidden");
}

function showForgot() {
  document.getElementById("view-login").classList.add("hidden");
  document.getElementById("view-register").classList.add("hidden");
  document.getElementById("view-forgot").classList.remove("hidden");
}

function showAlert(elementId, message, type = "error") {
  const alertDiv = document.getElementById(elementId);
  alertDiv.textContent = message;
  alertDiv.className = `alert alert-${type}`;
  alertDiv.classList.remove("hidden");
  setTimeout(() => alertDiv.classList.add("hidden"), 5000);
}

function toggleUserFields() {
  const userType = document.getElementById("reg-type").value;
  const sectionInterne = document.getElementById("section-interne");
  const sectionEtranger = document.getElementById("section-etranger");

  if (userType === "etudiant_etranger") {
    sectionInterne.classList.add("hidden");
    sectionEtranger.classList.remove("hidden");
  } else {
    sectionInterne.classList.remove("hidden");
    sectionEtranger.classList.add("hidden");
  }
}

function updatePriceDisplay() {
  const plan = document.getElementById("reg-plan").value;
  const priceText = document.getElementById("price-text");
  priceText.textContent = plan === "monthly" ? "9.99 €" : "89.99 €";
}

async function initiateKonnectPayment(userId, amount, plan) {
  try {
    const response = await fetch("http://localhost:3000/api/payment/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount, plan }),
    });
    const data = await response.json();
    if (data.success && data.payment_url) {
      window.location.href = data.payment_url;
    } else {
      showAlert("register-alert", data.error || "Erreur paiement");
    }
  } catch (error) {
    showAlert("register-alert", "Erreur de connexion au serveur");
  }
}

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-pass").value;
  if (!email || !password) return showAlert("login-alert", "Remplissez tous les champs");
  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard.html";
    } else {
      showAlert("login-alert", data.error || "Identifiants incorrects");
    }
  } catch (error) {
    showAlert("login-alert", "Erreur serveur");
  }
});

document.getElementById("form-register").addEventListener("submit", async (e) => {
  e.preventDefault();
  const prenom = document.getElementById("reg-prenom").value;
  const nom = document.getElementById("reg-nom").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-pass").value;
  const passwordConfirm = document.getElementById("reg-pass-confirm").value;
  const userType = document.getElementById("reg-type").value;
  const codeActivation = document.getElementById("reg-code").value;
  const plan = document.getElementById("reg-plan")?.value || "monthly";

  if (!prenom || !nom || !email || !password) return showAlert("register-alert", "Tous les champs requis");
  if (password !== passwordConfirm) return showAlert("register-alert", "Mots de passe différents");
  if (password.length < 6) return showAlert("register-alert", "6 caractères min");
  if (userType !== "etudiant_etranger" && !codeActivation) return showAlert("register-alert", "Code d'activation requis");

  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: prenom, lastName: nom, email, password, type: userType,
        codeActivation: userType !== "etudiant_etranger" ? codeActivation : null,
        subscriptionPlan: userType === "etudiant_etranger" ? plan : null,
      }),
    });
    const data = await response.json();
    if (data.success) {
      if (data.requiresPayment) {
        await initiateKonnectPayment(data.userId, data.amount, plan);
      } else {
        showAlert("register-alert", "Inscription réussie !", "success");
        setTimeout(() => { showLogin(); document.getElementById("form-register").reset(); }, 3000);
      }
    } else {
      showAlert("register-alert", data.error || "Erreur inscription");
    }
  } catch (error) {
    showAlert("register-alert", "Erreur serveur");
  }
});

document.getElementById("form-forgot").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("forgot-email").value;
  if (!email) return showAlert("forgot-alert", "Email requis");
  try {
    const res = await fetch("http://localhost:3000/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (data.success) {
      showAlert("forgot-alert", "Email envoyé", "success");
      setTimeout(() => showLogin(), 3000);
    } else {
      showAlert("forgot-alert", data.error || "Email non trouvé");
    }
  } catch (error) {
    showAlert("forgot-alert", "Erreur serveur");
  }
});

toggleUserFields();