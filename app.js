/* ════════════════════════════════════════════════
   app.js — Frontend Faculté
   Connecté à http://localhost:3000 (backend Express)
════════════════════════════════════════════════ */

const API = "http://localhost:3000/api";

// --- Gestion de la session ---
const userSession = JSON.parse(localStorage.getItem('userSession'));

if (!userSession) {
  // Redirection si l'utilisateur n'est pas connecté
  window.location.href = "index.html";
}

const USER_ID = userSession.id;
const USER_NAME = userSession.prenom || "Étudiant";

/* ── Données locales de fallback (si backend éteint) ── */
const LOCAL_DATA = [
  { id:1,  titre:"Algèbre linéaire – TD 1",         type:"exercices", section:"Sciences",  niveau:"Licence 1", description:"Espaces vectoriels et applications linéaires." },
  { id:2,  titre:"Analyse – Examen 2023",            type:"examens",   section:"Sciences",  niveau:"Licence 1", description:"Sujet officiel session principale 2023." },
  { id:3,  titre:"Physique générale – Cours",        type:"cours",     section:"Sciences",  niveau:"Licence 1", description:"Mécanique newtonienne et thermodynamique." },
  { id:4,  titre:"Chimie organique – TD 2",          type:"td",        section:"Sciences",  niveau:"Licence 1", description:"Réactions d'addition et de substitution." },
  { id:5,  titre:"Probabilités – Série 3",           type:"exercices", section:"Sciences",  niveau:"Licence 2", description:"Variables aléatoires discrètes et continues." },
  { id:6,  titre:"Électromagnétisme – Cours",        type:"cours",     section:"Sciences",  niveau:"Licence 2", description:"Équations de Maxwell et ondes." },
  { id:7,  titre:"Littérature française – TD",       type:"td",        section:"Lettres",   niveau:"Licence 1", description:"Analyse de texte : Flaubert et Zola." },
  { id:8,  titre:"Linguistique générale – Cours",    type:"cours",     section:"Lettres",   niveau:"Licence 1", description:"Phonologie, morphologie et syntaxe." },
  { id:9,  titre:"Littérature – Examen 2022",        type:"examens",   section:"Lettres",   niveau:"Licence 2", description:"Sujet officiel avec corrigé type." },
  { id:10, titre:"Droit civil – Introduction",       type:"cours",     section:"Droit",     niveau:"Licence 1", description:"Sources du droit et hiérarchie des normes." },
  { id:11, titre:"Droit constitutionnel – TD 1",     type:"td",        section:"Droit",     niveau:"Licence 1", description:"Séparation des pouvoirs et régimes politiques." },
  { id:12, titre:"Droit pénal – Examen 2023",        type:"examens",   section:"Droit",     niveau:"Licence 2", description:"Infractions et responsabilité pénale." },
  { id:13, titre:"Procédure civile – Série d'ex.",   type:"exercices", section:"Droit",     niveau:"Licence 3", description:"Compétences juridictionnelles et voies de recours." },
  { id:14, titre:"Microéconomie – Cours",            type:"cours",     section:"Économie",  niveau:"Licence 1", description:"Théorie du consommateur et du producteur." },
  { id:15, titre:"Macroéconomie – TD 1",             type:"td",        section:"Économie",  niveau:"Licence 1", description:"Modèle IS-LM et politique économique." },
  { id:16, titre:"Statistiques économiques – Série", type:"exercices", section:"Économie",  niveau:"Licence 2", description:"Indices, corrélation et régression." },
  { id:17, titre:"Finance d'entreprise – Examen",    type:"examens",   section:"Économie",  niveau:"Master",    description:"Analyse financière et évaluation de projets." },
  { id:18, titre:"Recherche opérationnelle – Cours", type:"cours",     section:"Sciences",  niveau:"Master",    description:"Programmation linéaire et algorithmes." },
  { id:19, titre:"Droit des affaires – Cours",       type:"cours",     section:"Droit",     niveau:"Master",    description:"Contrats commerciaux et droit des sociétés." },
  { id:20, titre:"Économétrie – TD avancé",          type:"td",        section:"Économie",  niveau:"Master",    description:"Modèles ARIMA et séries temporelles." },
  { id:21, titre:"Méthodologie de recherche",        type:"cours",     section:"Sciences",  niveau:"Doctorat",  description:"Rédaction scientifique et normes de citation." },
  { id:22, titre:"Séminaire : droit comparé",        type:"td",        section:"Droit",     niveau:"Doctorat",  description:"Comparaison des systèmes juridiques." },
];

/* ── État global ── */
let state = {
  activeSection: "Tous",
  activeNiveau: null,
  allData: [...LOCAL_DATA],
  fichiers: [],
  historique: [],
};

/* ════════════════════════════════════════════════
   UTILS
════════════════════════════════════════════════ */
function showToast(msg, duration = 2800) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), duration);
}

function openModal(title, bodyHTML) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = bodyHTML;
  document.getElementById("modalOverlay").classList.add("open");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

/* ════════════════════════════════════════════════
   API CALLS (avec fallback local)
════════════════════════════════════════════════ */
async function fetchRessources(params = {}) {
  const qs = new URLSearchParams({ userId: USER_ID, ...params }).toString();
  try {
    const res = await fetch(`${API}/ressources?${qs}`);
    const json = await res.json();
    return json.data;
  } catch {
    // Fallback local si backend éteint
    return filterLocal(params);
  }
}

function filterLocal({ q = "", section, niveau, categorie } = {}) {
  const typeMap = {
    "Séries d'exercices": "exercices",
    "Sujets d'Examens":   "examens",
    "Cours & Supports":   "cours",
    "Travaux Dirigés":    "td",
  };
  let data = [...LOCAL_DATA];
  if (section && section !== "Tous") data = data.filter(r => r.section === section);
  if (niveau)                        data = data.filter(r => r.niveau === niveau);
  if (categorie && categorie !== "Tous") {
    const t = typeMap[categorie];
    if (t) data = data.filter(r => r.type === t);
  }
  if (q.trim()) {
    const query = q.toLowerCase();
    data = data.filter(r => r.titre.toLowerCase().includes(query) || r.description.toLowerCase().includes(query));
  }
  return data;
}

async function fetchHistorique() {
  try {
    const res = await fetch(`${API}/users/${USER_ID}/historique`);
    const json = await res.json();
    return json.data;
  } catch { return state.historique; }
}

async function fetchFichiers() {
  try {
    const res = await fetch(`${API}/users/${USER_ID}/fichiers`);
    const json = await res.json();
    return json.data;
  } catch { return state.fichiers; }
}

async function addFichier(ressourceId) {
  try {
    const res = await fetch(`${API}/users/${USER_ID}/fichiers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ressourceId }),
    });
    const json = await res.json();
    return json.success;
  } catch {
    // Fallback local
    const item = LOCAL_DATA.find(r => r.id === ressourceId);
    if (item && !state.fichiers.find(f => f.ressourceId === item.id)) {
      state.fichiers.push({ ressourceId: item.id, titre: item.titre, type: item.type, dateTelechargement: new Date().toISOString() });
    }
    return true;
  }
}

async function deleteFichier(ressourceId) {
  try {
    await fetch(`${API}/users/${USER_ID}/fichiers/${ressourceId}`, { method: "DELETE" });
  } catch {
    state.fichiers = state.fichiers.filter(f => f.ressourceId !== ressourceId);
  }
}

async function fetchProfil() {
  try {
    const res = await fetch(`${API}/users/${USER_ID}/profil`);
    const json = await res.json();
    return json.data;
  } catch {
    return { nom: "Ahmed Ben Salem", email: "ahmed@univ.tn", niveau: "Licence 2", section: "Sciences" };
  }
}

/* ════════════════════════════════════════════════
   RENDER CARDS
════════════════════════════════════════════════ */
const TYPES = ["exercices", "examens", "cours", "td"];

function getFilteredByType(type, allData) {
  return allData.filter(r => r.type === type);
}

function renderCards(data) {
  TYPES.forEach(type => {
    const items = getFilteredByType(type, data);
    // Badge count
    document.getElementById(`badge-${type}`).textContent = items.length;
    // Preview (top 3 titles)
    const preview = document.getElementById(`preview-${type}`);
    if (items.length === 0) {
      preview.innerHTML = `<p class="card-preview-empty">Aucun résultat</p>`;
    } else {
      preview.innerHTML = items.slice(0, 3).map(r =>
        `<div class="card-preview-item" title="${r.description}">${r.titre}</div>`
      ).join("");
    }
  });
}

/* ════════════════════════════════════════════════
   RENDER RESULTS PANEL
════════════════════════════════════════════════ */
function renderResults(data, title = "Résultats") {
  const panel = document.getElementById("resultsPanel");
  const list = document.getElementById("resultsList");
  const titleEl = document.getElementById("resultsTitle");

  titleEl.textContent = `${title} — ${data.length} trouvé${data.length > 1 ? "s" : ""}`;

  if (data.length === 0) {
    list.innerHTML = `<li class="no-results">Aucune ressource trouvée pour ces critères.</li>`;
  } else {
    list.innerHTML = data.map((r, i) => `
      <li class="result-item" style="animation-delay:${i * 0.04}s">
        <span class="result-type-dot dot-${r.type}"></span>
        <div class="result-info">
          <div class="result-titre">${r.titre}</div>
          <div class="result-meta">${r.section} · ${r.niveau}</div>
        </div>
        <button class="result-download" data-id="${r.id}" data-titre="${r.titre}">
          ↓ Installer
        </button>
      </li>
    `).join("");

    // Bind download buttons
    list.querySelectorAll(".result-download").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.dataset.id);
        const titre = btn.dataset.titre;
        await addFichier(id);
        btn.textContent = "✓ Installé";
        btn.style.background = "#e8f5e9";
        btn.style.color = "#2e7d32";
        showToast(`"${titre}" ajouté aux fichiers installés.`);
      });
    });
  }

  panel.style.display = "";
}

/* ════════════════════════════════════════════════
   REFRESH — charger + afficher selon l'état
════════════════════════════════════════════════ */
async function refresh(showResults = false, query = "") {
  const params = {};
  if (state.activeSection !== "Tous") params.section = state.activeSection;
  if (state.activeNiveau) params.niveau = state.activeNiveau;
  if (query) params.q = query;

  const data = await fetchRessources(params);
  renderCards(data);

  if (showResults) {
    const label = query || state.activeSection !== "Tous" ? `"${query || state.activeSection}"` : "Tous";
    renderResults(data, `Résultats pour ${label}`);
  }
}

/* ════════════════════════════════════════════════
   SIDEBAR FILTERS
════════════════════════════════════════════════ */
document.querySelectorAll(".nav-item[data-filter]").forEach(item => {
  item.addEventListener("click", () => {
    const filter = item.dataset.filter;
    const value = item.dataset.value;

    if (filter === "section") {
      // Deselect previous section
      document.querySelectorAll(".nav-item[data-filter='section']").forEach(el => el.classList.remove("active"));
      item.classList.add("active");
      state.activeSection = value;
    } else if (filter === "niveau") {
      // Toggle niveau
      const wasActive = item.classList.contains("active");
      document.querySelectorAll(".nav-item[data-filter='niveau']").forEach(el => el.classList.remove("active"));
      if (!wasActive) {
        item.classList.add("active");
        state.activeNiveau = value;
      } else {
        state.activeNiveau = null;
      }
    }

    refresh(true, "");
  });
});

/* ════════════════════════════════════════════════
   SEARCH
════════════════════════════════════════════════ */
document.getElementById("searchBtn").addEventListener("click", doSearch);
document.getElementById("searchInput").addEventListener("keydown", e => {
  if (e.key === "Enter") doSearch();
});

async function doSearch() {
  const q = document.getElementById("searchInput").value.trim();
  const cat = document.getElementById("categorySelect").value;

  const params = {};
  if (state.activeSection !== "Tous") params.section = state.activeSection;
  if (state.activeNiveau) params.niveau = state.activeNiveau;
  if (q) params.q = q;
  if (cat !== "Tous") params.categorie = cat;

  const data = await fetchRessources(params);

  // Save to local history fallback
  if (q) {
    state.historique.unshift({ query: q, categorie: cat, date: new Date().toISOString() });
    if (state.historique.length > 20) state.historique.pop();
  }

  renderCards(data);
  renderResults(data, q ? `"${q}"` : `Catégorie : ${cat}`);
}

/* ════════════════════════════════════════════════
   CARD CTAs
════════════════════════════════════════════════ */
document.querySelectorAll(".card-cta").forEach(btn => {
  btn.addEventListener("click", async () => {
    const type = btn.dataset.type;
    const typeLabels = {
      exercices: "Séries d'exercices",
      examens:   "Sujets d'Examens",
      cours:     "Cours & Supports",
      td:        "Travaux Dirigés",
    };

    const params = { categorie: typeLabels[type] };
    if (state.activeSection !== "Tous") params.section = state.activeSection;
    if (state.activeNiveau) params.niveau = state.activeNiveau;

    const data = await fetchRessources(params);
    renderResults(data, typeLabels[type]);
  });
});

/* ════════════════════════════════════════════════
   CLOSE RESULTS
════════════════════════════════════════════════ */
document.getElementById("closeResults").addEventListener("click", () => {
  document.getElementById("resultsPanel").style.display = "none";
});

/* ════════════════════════════════════════════════
   PROFILE MENU
════════════════════════════════════════════════ */

// Réglages du Profil
document.getElementById("btnProfil").addEventListener("click", async () => {
  const profil = await fetchProfil();
  openModal("Réglages du Profil", `
    <div class="modal-form">
      <div class="form-group">
        <label class="form-label">Nom complet</label>
        <input class="form-input" id="fNom" value="${profil.nom}" />
      </div>
      <div class="form-group">
        <label class="form-label">Adresse email</label>
        <input class="form-input" id="fEmail" type="email" value="${profil.email}" />
      </div>
      <div class="form-group">
        <label class="form-label">Niveau</label>
        <input class="form-input" id="fNiveau" value="${profil.niveau || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Section</label>
        <input class="form-input" id="fSection" value="${profil.section || ''}" />
      </div>
      <button class="btn-save" id="saveProfil">Enregistrer les modifications</button>
    </div>
  `);

  document.getElementById("saveProfil").addEventListener("click", async () => {
    const body = {
      nom:     document.getElementById("fNom").value,
      email:   document.getElementById("fEmail").value,
      niveau:  document.getElementById("fNiveau").value,
      section: document.getElementById("fSection").value,
    };
    try {
      await fetch(`${API}/users/${USER_ID}/profil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {}
    closeModal();
    showToast("Profil mis à jour avec succès !");
  });
});

// Historique de Recherche
document.getElementById("btnHistorique").addEventListener("click", async () => {
  const hist = await fetchHistorique();

  if (hist.length === 0) {
    openModal("Historique de Recherche", `<p style="color:var(--text-muted);font-size:.86rem">Aucune recherche enregistrée.</p>`);
    return;
  }

  const items = hist.map(h => `
    <li class="history-entry">
      <span class="history-q">${h.query}</span>
      <span class="history-cat">${h.categorie || "Tous"}</span>
      <span class="history-date">${new Date(h.date).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}</span>
    </li>
  `).join("");

  openModal("Historique de Recherche", `<ul class="history-list">${items}</ul>`);
});

// Fichiers Installés
document.getElementById("btnFichiers").addEventListener("click", async () => {
  const files = await fetchFichiers();

  if (files.length === 0) {
    openModal("Fichiers Installés", `<p style="color:var(--text-muted);font-size:.86rem">Aucun fichier installé. Cliquez sur "↓ Installer" dans les résultats.</p>`);
    return;
  }

  const renderFichiersModal = (files) => {
    const items = files.map(f => `
      <li class="fichier-entry">
        <span class="fichier-titre">${f.titre}</span>
        <span class="fichier-type type-${f.type}">${f.type}</span>
        <button class="fichier-delete" data-id="${f.ressourceId}" title="Supprimer">
          <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </li>
    `).join("");

    openModal("Fichiers Installés", `<ul class="fichiers-list">${items}</ul>`);

    document.querySelectorAll(".fichier-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.dataset.id);
        await deleteFichier(id);
        const updated = await fetchFichiers();
        if (updated.length === 0) {
          closeModal();
          showToast("Tous les fichiers ont été supprimés.");
        } else {
          renderFichiersModal(updated);
        }
      });
    });
  };

  renderFichiersModal(files);
});

// Déconnexion
document.getElementById("btnDeconnexion").addEventListener("click", async () => {
  openModal("Déconnexion", `
    <p style="margin-bottom:16px">Êtes-vous sûr de vouloir vous déconnecter ?</p>
    <button class="btn-save" style="background:var(--accent-red)" id="confirmLogout">Confirmer la déconnexion</button>
  `);
  document.getElementById("confirmLogout").addEventListener("click", async () => {
    try { await fetch(`${API}/auth/logout`, { method: "POST" }); } catch {}
    closeModal();
    showToast("Vous avez été déconnecté.");
    setTimeout(() => {
      document.querySelector(".topbar-avatar span").textContent = "?";
      document.querySelector(".avatar-dot").style.background = "#9e9e9e";
    }, 1000);
  });
});

/* ════════════════════════════════════════════════
   MODAL ÉMETTRE
════════════════════════════════════════════════ */
const emOverlay = document.getElementById("emettreOverlay");
const emClose   = document.getElementById("emettreClose");
const emCancel  = document.getElementById("emettreCancel");
const btnEmettre = document.getElementById("btnEmettre");
const emDropZone = document.getElementById("emDropZone");
const emFileInput = document.getElementById("em-file");
const emFilename = document.getElementById("em-filename");
const emSubmit   = document.getElementById("emettreSubmit");

// Ouvrir
btnEmettre.addEventListener("click", () => {
  emOverlay.classList.add("open");
});

// Fermer
[emClose, emCancel].forEach(btn => {
  btn.addEventListener("click", () => {
    emOverlay.classList.remove("open");
  });
});

// Dropzone & File selection
emDropZone.addEventListener("click", () => emFileInput.click());

emFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    emFilename.textContent = `Fichier sélectionné : ${file.name}`;
  }
});

emDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  emDropZone.style.borderColor = "var(--primary)";
  emDropZone.style.background = "#f0f7ff";
});

emDropZone.addEventListener("dragleave", () => {
  emDropZone.style.borderColor = "#e0e0e0";
  emDropZone.style.background = "#fafafa";
});

emDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  emDropZone.style.borderColor = "#e0e0e0";
  emDropZone.style.background = "#fafafa";
  const file = e.dataTransfer.files[0];
  if (file) {
    emFileInput.files = e.dataTransfer.files;
    emFilename.textContent = `Fichier sélectionné : ${file.name}`;
  }
});

// Submit
emSubmit.addEventListener("click", async () => {
  const titre   = document.getElementById("em-titre").value;
  const type    = document.getElementById("em-type").value;
  const section = document.getElementById("em-section").value;
  const niveau  = document.getElementById("em-niveau").value;
  const annee   = document.getElementById("em-annee").value;
  const file    = emFileInput.files[0];

  if (!titre || !type || !section || !niveau || !annee) {
    showToast("Veuillez remplir tous les champs obligatoires (*)");
    return;
  }

  if (!file) {
    showToast("Veuillez sélectionner un fichier à télécharger.");
    return;
  }

  // Simulation d'envoi
  emSubmit.disabled = true;
  emSubmit.textContent = "Envoi...";

  setTimeout(() => {
    showToast(`Ressource "${titre}" (${annee}) ajoutée avec succès !`);
    emSubmit.disabled = false;
    emSubmit.textContent = "Ajouter";
    emOverlay.classList.remove("open");
    
    // Réinitialisation du formulaire
    document.getElementById("em-titre").value = "";
    document.getElementById("em-type").value = "";
    document.getElementById("em-section").value = "";
    document.getElementById("em-niveau").value = "";
    document.getElementById("em-annee").value = "";
    emFileInput.value = "";
    emFilename.textContent = "";
  }, 1500);
});

/* ════════════════════════════════════════════════
   MODAL CLOSE
════════════════════════════════════════════════ */
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalOverlay").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeModal();
});

/* ════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════ */
(async function init() {
  // Mise à jour de l'UI avec les infos de session
  const avatarSpan = document.querySelector(".topbar-avatar span");
  if (avatarSpan) avatarSpan.textContent = USER_NAME.charAt(0).toUpperCase();

  const data = await fetchRessources();
  renderCards(data);
  const statTotal = document.getElementById("statTotal");
  if (statTotal) statTotal.textContent = data.length;
})();

// Logout logic with confirmation
document.getElementById("btnDeconnexion").addEventListener("click", () => {
  openModal("Déconnexion", `
    <p style="margin-bottom:16px">Êtes-vous sûr de vouloir vous déconnecter ?</p>
    <button class="btn-save" style="background:var(--accent-red)" id="confirmLogout">Confirmer la déconnexion</button>
  `);
  
  document.getElementById("confirmLogout").addEventListener("click", () => {
    localStorage.removeItem('userSession');
    window.location.href = "index.html";
  });
});

