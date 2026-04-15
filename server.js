import supabase from "./database.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

const app=express();
app.use(cors());
app.use(express.json());
dotenv.config({
  path:"./.env",
});
// ─── DATA ────────────────────────────────────────────────────────────────────

const sections = [
  { id: 1, name: "Sciences" },
  { id: 2, name: "Lettres" },
  { id: 3, name: "Droit" },
  { id: 4, name: "Économie" },
];

const niveaux = [
  { id: 1, name: "Licence 1" },
  { id: 2, name: "Licence 2" },
  { id: 3, name: "Licence 3" },
  { id: 4, name: "Master" },
  { id: 5, name: "Doctorat" },
];

const categories = ["Tous", "Séries d'exercices", "Sujets d'Examens", "Cours & Supports", "Travaux Dirigés"];

const ressources = [
  // Sciences - Licence 1
  { id: 1,  titre: "Algèbre linéaire – TD 1",          type: "exercices",  section: "Sciences",  niveau: "Licence 1", description: "Espaces vectoriels et applications linéaires." },
  { id: 2,  titre: "Analyse – Examen 2023",             type: "examens",    section: "Sciences",  niveau: "Licence 1", description: "Sujet officiel session principale 2023." },
  { id: 3,  titre: "Physique générale – Cours",         type: "cours",      section: "Sciences",  niveau: "Licence 1", description: "Mécanique newtonienne et thermodynamique." },
  { id: 4,  titre: "Chimie organique – TD 2",           type: "td",         section: "Sciences",  niveau: "Licence 1", description: "Réactions d'addition et de substitution." },

  // Sciences - Licence 2
  { id: 5,  titre: "Probabilités – Série 3",            type: "exercices",  section: "Sciences",  niveau: "Licence 2", description: "Variables aléatoires discrètes et continues." },
  { id: 6,  titre: "Électromagnétisme – Cours",         type: "cours",      section: "Sciences",  niveau: "Licence 2", description: "Équations de Maxwell et ondes." },

  // Lettres - Licence 1
  { id: 7,  titre: "Littérature française – TD",        type: "td",         section: "Lettres",   niveau: "Licence 1", description: "Analyse de texte : Flaubert et Zola." },
  { id: 8,  titre: "Linguistique générale – Cours",     type: "cours",      section: "Lettres",   niveau: "Licence 1", description: "Phonologie, morphologie et syntaxe." },
  { id: 9,  titre: "Littérature – Examen 2022",         type: "examens",    section: "Lettres",   niveau: "Licence 2", description: "Sujet officiel avec corrigé type." },

  // Droit - Licence 1
  { id: 10, titre: "Droit civil – Introduction",        type: "cours",      section: "Droit",     niveau: "Licence 1", description: "Sources du droit et hiérarchie des normes." },
  { id: 11, titre: "Droit constitutionnel – TD 1",      type: "td",         section: "Droit",     niveau: "Licence 1", description: "Séparation des pouvoirs et régimes politiques." },
  { id: 12, titre: "Droit pénal – Examen 2023",         type: "examens",    section: "Droit",     niveau: "Licence 2", description: "Infractions et responsabilité pénale." },
  { id: 13, titre: "Procédure civile – Série d'ex.",    type: "exercices",  section: "Droit",     niveau: "Licence 3", description: "Compétences juridictionnelles et voies de recours." },

  // Économie - Licence 1
  { id: 14, titre: "Microéconomie – Cours",             type: "cours",      section: "Économie",  niveau: "Licence 1", description: "Théorie du consommateur et du producteur." },
  { id: 15, titre: "Macroéconomie – TD 1",              type: "td",         section: "Économie",  niveau: "Licence 1", description: "Modèle IS-LM et politique économique." },
  { id: 16, titre: "Statistiques économiques – Série",  type: "exercices",  section: "Économie",  niveau: "Licence 2", description: "Indices, corrélation et régression." },
  { id: 17, titre: "Finance d'entreprise – Examen",     type: "examens",    section: "Économie",  niveau: "Master",    description: "Analyse financière et évaluation de projets." },

  // Master
  { id: 18, titre: "Recherche opérationnelle – Cours",  type: "cours",      section: "Sciences",  niveau: "Master",    description: "Programmation linéaire et algorithmes." },
  { id: 19, titre: "Droit des affaires – Cours",        type: "cours",      section: "Droit",     niveau: "Master",    description: "Contrats commerciaux et droit des sociétés." },
  { id: 20, titre: "Économétrie – TD avancé",           type: "td",         section: "Économie",  niveau: "Master",    description: "Modèles ARIMA et séries temporelles." },

  // Doctorat
  { id: 21, titre: "Méthodologie de recherche",         type: "cours",      section: "Sciences",  niveau: "Doctorat",  description: "Rédaction scientifique et normes de citation." },
  { id: 22, titre: "Séminaire : droit comparé",         type: "td",         section: "Droit",     niveau: "Doctorat",  description: "Comparaison des systèmes juridiques." },
];

const users = [
  { id: 1, nom: "Ahmed Ben Salem",   email: "ahmed@univ.tn",   role: "etudiant", niveau: "Licence 2", section: "Sciences"  },
  { id: 2, nom: "Fatma Trabelsi",    email: "fatma@univ.tn",   role: "etudiant", niveau: "Master",    section: "Économie"  },
  { id: 3, nom: "Karim Mansouri",    email: "karim@univ.tn",   role: "etudiant", niveau: "Licence 1", section: "Droit"     },
  { id: 4, nom: "Nadia Chaouachi",   email: "nadia@univ.tn",   role: "admin",    niveau: null,        section: null        },
];

// Simple search history store (in-memory)
const searchHistory = {};
const fichiersTelecharges = {};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const typeMap = {
  "Séries d'exercices": "exercices",
  "Sujets d'Examens":   "examens",
  "Cours & Supports":   "cours",
  "Travaux Dirigés":    "td",
};

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// GET /api/sections — liste des sections
app.get("/api/sections", (req, res) => {
  res.json({ success: true, data: sections });
});

// GET /api/niveaux — liste des niveaux
app.get("/api/niveaux", (req, res) => {
  res.json({ success: true, data: niveaux });
});

// GET /api/categories — liste des catégories
app.get("/api/categories", (req, res) => {
  res.json({ success: true, data: categories });
});

// GET /api/ressources — toutes les ressources avec filtres optionnels
// Query params: q, categorie, section, niveau
app.get("/api/ressources", (req, res) => {
  const { q = "", categorie = "Tous", section, niveau, userId } = req.query;

  let results = [...ressources];

  // Filtre catégorie
  if (categorie && categorie !== "Tous") {
    const typeKey = typeMap[categorie];
    if (typeKey) results = results.filter((r) => r.type === typeKey);
  }

  // Filtre section
  if (section) results = results.filter((r) => r.section === section);

  // Filtre niveau
  if (niveau) results = results.filter((r) => r.niveau === niveau);

  // Filtre texte (titre ou description)
  if (q.trim()) {
    const query = q.toLowerCase();
    results = results.filter(
      (r) =>
        r.titre.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
    );
  }

  // Sauvegarde historique si userId fourni et qu'il y a une vraie recherche
  if (userId && q.trim()) {
    if (!searchHistory[userId]) searchHistory[userId] = [];
    const entry = { query: q, categorie, date: new Date().toISOString() };
    // Éviter les doublons consécutifs
    const last = searchHistory[userId].at(-1);
    if (!last || last.query !== q) {
      searchHistory[userId].unshift(entry);
      if (searchHistory[userId].length > 20) searchHistory[userId].pop();
    }
  }

  res.json({
    success: true,
    total: results.length,
    data: results,
  });
});

// GET /api/ressources/:id — détail d'une ressource
app.get("/api/ressources/:id", (req, res) => {
  const ressource = ressources.find((r) => r.id === parseInt(req.params.id));
  if (!ressource) return res.status(404).json({ success: false, message: "Ressource introuvable." });
  res.json({ success: true, data: ressource });
});

// GET /api/ressources/type/:type — ressources par type (exercices / examens / cours / td)
app.get("/api/ressources/type/:type", (req, res) => {
  const { type } = req.params;
  const validTypes = ["exercices", "examens", "cours", "td"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ success: false, message: "Type invalide. Valeurs acceptées : " + validTypes.join(", ") });
  }
  const results = ressources.filter((r) => r.type === type);
  res.json({ success: true, total: results.length, data: results });
});

// ─── PROFIL ──────────────────────────────────────────────────────────────────

// GET /api/users/:id/profil
app.get("/api/users/:id/profil", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
  res.json({ success: true, data: user });
});

// PUT /api/users/:id/profil — mise à jour du profil
app.put("/api/users/:id/profil", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable." });

  const { nom, email, niveau, section } = req.body;
  if (nom)    user.nom     = nom;
  if (email)  user.email   = email;
  if (niveau) user.niveau  = niveau;
  if (section) user.section = section;

  res.json({ success: true, message: "Profil mis à jour.", data: user });
});

// ─── HISTORIQUE DE RECHERCHE ─────────────────────────────────────────────────

// GET /api/users/:id/historique
app.get("/api/users/:id/historique", (req, res) => {
  const history = searchHistory[req.params.id] || [];
  res.json({ success: true, total: history.length, data: history });
});

// DELETE /api/users/:id/historique — effacer l'historique
app.delete("/api/users/:id/historique", (req, res) => {
  searchHistory[req.params.id] = [];
  res.json({ success: true, message: "Historique supprimé." });
});

// ─── FICHIERS INSTALLÉS ───────────────────────────────────────────────────────

// POST /api/users/:id/fichiers — simuler un téléchargement
app.post("/api/users/:id/fichiers", (req, res) => {
  const { ressourceId } = req.body;
  const ressource = ressources.find((r) => r.id === parseInt(ressourceId));
  if (!ressource) return res.status(404).json({ success: false, message: "Ressource introuvable." });

  const userId = req.params.id;
  if (!fichiersTelecharges[userId]) fichiersTelecharges[userId] = [];

  const alreadyExists = fichiersTelecharges[userId].find((f) => f.ressourceId === ressource.id);
  if (!alreadyExists) {
    fichiersTelecharges[userId].push({
      ressourceId: ressource.id,
      titre: ressource.titre,
      type: ressource.type,
      dateTelechargement: new Date().toISOString(),
    });
  }

  res.json({ success: true, message: `"${ressource.titre}" ajouté aux fichiers installés.` });
});

// GET /api/users/:id/fichiers — liste des fichiers téléchargés
app.get("/api/users/:id/fichiers", (req, res) => {
  const files = fichiersTelecharges[req.params.id] || [];
  res.json({ success: true, total: files.length, data: files });
});

// DELETE /api/users/:id/fichiers/:ressourceId — supprimer un fichier
app.delete("/api/users/:id/fichiers/:ressourceId", (req, res) => {
  const userId = req.params.id;
  const rid = parseInt(req.params.ressourceId);
  if (fichiersTelecharges[userId]) {
    fichiersTelecharges[userId] = fichiersTelecharges[userId].filter((f) => f.ressourceId !== rid);
  }
  res.json({ success: true, message: "Fichier supprimé." });
});

// ─── AUTH SIMULÉE ─────────────────────────────────────────────────────────────

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email et mot de passe requis." });
  }
  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect." });
  }
  // Mot de passe simulé : "1234" pour tout le monde
  if (password !== "1234") {
    return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect." });
  }
  res.json({
    success: true,
    message: "Connexion réussie.",
    data: { token: `fake-jwt-token-user-${user.id}`, user },
  });
});

// POST /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true, message: "Déconnexion réussie." });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route "${req.method} ${req.path}" introuvable.` });
});

// test db connectivity
export const testdb=async()=>{
  try{
      const {data,error}= await supabase
        .from ('users')
        .select('*')
        .limit('1');
        if(error) throw error;
        console.log("supabase reachable");
      return true;}
  catch (error) {
        console.error('Cannot reach Supabase');
        return false;
    }
     }
testdb();
// ─── START ────────────────────────────────────────────────────────────────────
app.listen(process.env.port, () => {
  console.log(`✅  Serveur Faculté démarré sur http://localhost:${process.env.port}`);
  console.log(`📚  ${ressources.length} ressources chargées — ${users.length} utilisateurs simulés`);
});

export default app;
