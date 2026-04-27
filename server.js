import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import supabase from "./database.js";

const app = express();

// --- 1. CONFIGURATION DE SÉCURITÉ ---
app.use(helmet()); 
app.use(cors());
app.use(express.json());

// Limiteur pour éviter les attaques par force brute sur l'auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: { success: false, message: "Trop de tentatives. Réessayez plus tard." }
});

// --- 2. FONCTIONS UTILITAIRES ---
function validateLuhn(number) {
    let sum = 0;
    let shouldDouble = false;
    const sanitized = number.replace(/\s/g, '');
    if (!/^\d+$/.test(sanitized)) return false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
        let digit = parseInt(sanitized.charAt(i));
        if (shouldDouble) {
            if ((digit *= 2) > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0 && sanitized.length >= 13;
}

// --- 3. ROUTES AUTHENTIFICATION ---

// ROUTE D'INSCRIPTION UNIQUE ET ROBUSTE
app.post("/api/auth/register", authLimiter, async (req, res) => {
    const { 
        prenom, nom, email, password, 
        type_utilisateur, code_inscription, 
        plan_abonnement, card_info, card_token 
    } = req.body;

    try {
        let userRole = 'etudiant'; // Par défaut
        // A. Vérification existence utilisateur
        const { data: existingUser } = await supabase
            .from('utilisateurs')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ success: false, message: "Cet email est déjà enregistré." });
        }

        // B. Validation mot de passe
        if (!password || password.length < 8) {
            return res.status(400).json({ success: false, message: "Le mot de passe doit contenir au moins 8 caractères." });
        }

        // C. Logique de validation métier (Interne vs Etranger)
        if (type_utilisateur === 'interne') {
            const { data: codeData, error: codeError } = await supabase
                .from('codes_academiques')
                .select('*')
                .eq('code_valide', code_inscription)
                .eq('est_utilise', false)
                .single();

            if (codeError || !codeData) {
                return res.status(400).json({ success: false, message: "Code académique invalide ou expiré." });
            }
            
            // On récupère le rôle associé au code
            userRole = codeData.type_code;

            // Marquer le code comme utilisé
            await supabase.from('codes_academiques').update({ est_utilise: true }).eq('code_valide', code_inscription);

        } else if (type_utilisateur === 'etranger') {
            userRole = 'etudiant';
            // Sécurité Paiement
            if (card_token) {
                if (!card_token.startsWith('tok_')) {
                    return res.status(402).json({ success: false, message: "Référence de paiement invalide." });
                }
            } else if (card_info && card_info.number) {
                if (!validateLuhn(card_info.number)) {
                    return res.status(400).json({ success: false, message: "Numéro de carte incorrect." });
                }
            } else {
                return res.status(400).json({ success: false, message: "Informations de paiement requises." });
            }
        }

        // D. Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // E. Insertion de l'utilisateur
        const { data: newUser, error: insertError } = await supabase
            .from('utilisateurs')
            .insert([{
                prenom, nom, email,
                password: hashedPassword,
                type_utilisateur,
                role: userRole, // Nouveau: On enregistre le rôle (prof ou etudiant)
                statut_compte: 'actif',
                date_inscription: new Date()
            }])
            .select().single();

        if (insertError) throw insertError;

        // F. Gestion de l'abonnement (pour les étrangers)
        if (type_utilisateur === 'etranger') {
            const duree = plan_abonnement === 'annuel' ? 12 : 1;
            const expiration = new Date();
            expiration.setMonth(expiration.getMonth() + duree);

            await supabase.from('abonnements_payants').insert([{
                user_id: newUser.id,
                date_fin_validite: expiration,
                montant_paye: plan_abonnement === 'annuel' ? 100.00 : 10.00,
                statut_paiement: 'succes'
            }]);
        }

        res.status(201).json({ success: true, message: "Inscription réussie." });

    } catch (err) {
        console.error("Erreur Register:", err);
        res.status(500).json({ success: false, message: "Erreur lors de la création du compte." });
    }
});

// ROUTE LOGIN UNIQUE
app.post("/api/auth/login", authLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data: user, error } = await supabase
            .from('utilisateurs')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ success: false, message: "Identifiants incorrects." });
        }

        // Vérification Bcrypt (Professionnel)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Identifiants incorrects." });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, message: "Connexion réussie", data: { user: userWithoutPassword } });

    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur technique." });
    }
});

// --- 4. DATA & AUTRES ROUTES ---
const sections = [ { id: 1, name: "Sciences" }, { id: 2, name: "Lettres" }, { id: 3, name: "Droit" }, { id: 4, name: "Économie" } ];
const niveaux = [ { id: 1, name: "Licence 1" }, { id: 2, name: "Licence 2" }, { id: 3, name: "Licence 3" }, { id: 4, name: "Master" }, { id: 5, name: "Doctorat" } ];
const categories = ["Tous", "Séries d'exercices", "Sujets d'Examens", "Cours & Supports", "Travaux Dirigés"];

app.get("/api/sections", (req, res) => res.json({ success: true, data: sections }));
app.get("/api/niveaux", (req, res) => res.json({ success: true, data: niveaux }));
app.get("/api/categories", (req, res) => res.json({ success: true, data: categories }));

// GET PROFIL
app.get("/api/users/:id/profil", async (req, res) => {
    const { data, error } = await supabase.from('utilisateurs').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ success: false, message: "Introuvable" });
    res.json({ success: true, data });
});

// UPDATE PROFIL (جديد)
app.put("/api/users/:id/profil", async (req, res) => {
    const { prenom, nom, email, niveau, section } = req.body;
    try {
        const { data, error } = await supabase
            .from('utilisateurs')
            .update({ prenom, nom, email, niveau, section })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur lors de la mise à jour du profil." });
    }
});

// --- ROUTES RESSOURCES ---

// 1. Lister les ressources (avec filtres)
app.get("/api/ressources", async (req, res) => {
    const { q, section, niveau, categorie } = req.query;
    let query = supabase.from('ressources').select('*');

    if (q) query = query.ilike('titre', `%${q}%`);
    if (section) query = query.eq('section', section);
    if (niveau) query = query.eq('niveau', niveau);
    if (categorie) {
        const typeMap = {
            "Séries d'exercices": "exercices",
            "Sujets d'Examens":   "examens",
            "Cours & Supports":   "cours",
            "Travaux Dirigés":    "td",
        };
        const type = typeMap[categorie];
        if (type) query = query.eq('type_ressource', type);
    }

    try {
        const { data, error } = await query.order('date_creation', { ascending: false });
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur lors de la récupération des ressources." });
    }
});

// 2. Ajouter une ressource (Réservé aux Professeurs)
app.post("/api/ressources", async (req, res) => {
    const { titre, type, section, niveau, annee, userId, url_fichier } = req.body;
    
    try {
        // Vérification de sécurité: Est-ce que l'utilisateur est un prof?
        const { data: user, error: userError } = await supabase
            .from('utilisateurs')
            .select('role')
            .eq('id', userId)
            .single();

        if (userError || !user || user.role !== 'prof') {
            return res.status(403).json({ success: false, message: "Accès refusé: Seuls les professeurs peuvent émettre des ressources." });
        }

        const { data, error } = await supabase.from('ressources').insert([{
            titre,
            type_ressource: type,
            section,
            niveau,
            annee_universitaire: annee,
            user_id: userId,
            url_fichier: url_fichier || "https://example.com/file.pdf"
        }]).select().single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur lors de l'ajout de la ressource." });
    }
});

// --- 5. DÉMARRAGE ---
async function testdb() {
    try {
        const { error } = await supabase.from('utilisateurs').select('id').limit(1);
        if (error) console.error("❌ Erreur Supabase :", error.message);
        else console.log("✅ Connexion Supabase réussie !");
    } catch (err) { console.error("❌ Erreur de connexion :", err.message); }
}

testdb();

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur pro lancé sur http://localhost:${PORT}`);
});

export default app;
