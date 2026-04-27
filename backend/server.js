import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Connexion Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SERVICE_ROLE_KEY existe:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// ============ ROUTES API ============

// 1. Route de connexion
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email et mot de passe requis",
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: "Email ou mot de passe incorrect",
      });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    res.json({
      success: true,
      message: "Connexion réussie",
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userData?.role || "student",
        type: userData?.type || "etudiant_interne",
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// 2. Route d'inscription (avec paiement pour étrangers)
app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      type,
      codeActivation,
      subscriptionPlan,
    } = req.body;

    if (!email || !password || !firstName || !lastName || !type) {
      return res.status(400).json({
        success: false,
        error: "Tous les champs sont requis",
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Cet email est déjà utilisé",
      });
    }

    // Créer l'utilisateur dans Supabase Auth
    const { data: authUser, error: signUpError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          user_type: type,
        },
      });

    if (signUpError) {
      return res.status(400).json({
        success: false,
        error: signUpError.message,
      });
    }

    // ========== ÉTUDIANT / PROFESSEUR INTERNE ==========
    if (type === "etudiant_interne" || type === "professeur_interne") {
      await supabase.from("users").insert({
        id: authUser.user.id,
        email,
        role: "user",
        type: type,
        status: "active",
      });

      if (type === "etudiant_interne") {
        await supabase.from("etudiants_internes").insert({
          id: authUser.user.id,
          student_id: `STU${Date.now()}`,
          first_name: firstName,
          last_name: lastName,
          activation_code: codeActivation,
          status: "active",
        });
      } else if (type === "professeur_interne") {
        await supabase.from("professeurs_internes").insert({
          id: authUser.user.id,
          professor_id: `PROF${Date.now()}`,
          first_name: firstName,
          last_name: lastName,
          activation_code: codeActivation,
          status: "active",
          department: "Non spécifié",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Inscription réussie !",
      });
    }

    // ========== ÉTUDIANT ÉTRANGER (avec paiement) ==========
    if (type === "etudiant_etranger") {
      // Créer l'utilisateur dans la table users (statut pending)
      await supabase.from("users").insert({
        id: authUser.user.id,
        email,
        role: "user",
        type: type,
        status: "pending",
      });

      // Créer l'étudiant étranger dans foreign_students (inactif)
      await supabase.from("foreign_students").insert({
        id: authUser.user.id,
        country: "Non spécifié",
        subscription_type: subscriptionPlan || "monthly",
        subscription_status: "inactive",
      });

      // Créer un enregistrement de paiement en attente
      const amount = subscriptionPlan === "monthly" ? 9.99 : 89.99;
      const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

      await supabase.from("payments").insert({
        user_id: authUser.user.id,
        amount: amount,
        currency: "EUR",
        status: "pending",
        transaction_id: transactionId,
        created_at: new Date(),
      });

      return res.status(201).json({
        success: true,
        requiresPayment: true,
        userId: authUser.user.id,
        transactionId: transactionId,
        amount: amount,
        message: "Veuillez procéder au paiement",
      });
    }

    res.status(400).json({
      success: false,
      error: "Type d'utilisateur invalide",
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ========== ROUTE PAIEMENT (VRAIE INTÉGRATION KONNECT) ==========
app.post("/api/payment/init", async (req, res) => {
  try {
    const { userId, amount, plan } = req.body;

    // Konnect attend un montant en centimes (ex: 1000 = 10.00 XAF)
    const amountInt = Math.round(parseFloat(amount) * 100);

    // Générer un ID de transaction unique
    const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const konnectData = {
      amount: amountInt,
      currency: "XAF",
      receiverWalletId: process.env.KONNECT_WALLET_ID,
    };

    const response = await fetch(`${process.env.KONNECT_API_URL}/payments/init-payment`, {
      method: "POST",
      headers: {
        "x-api-key": process.env.KONNECT_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(konnectData),
    });

    const data = await response.json();

    console.log("📥 Réponse Konnect:", data);

    if (data.payUrl) {
      // Stocker le paymentRef dans la base
      await supabase
        .from("payments")
        .update({ 
          transaction_id: data.paymentRef,
          status: "pending"
        })
        .eq("user_id", userId)
        .eq("status", "pending");

      res.json({
        success: true,
        payment_url: data.payUrl,
        transaction_id: data.paymentRef,
      });
    } else {
      throw new Error("Erreur Konnect: pas de payUrl");
    }
  } catch (error) {
    console.error("❌ Erreur Konnect:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 4. Route de confirmation de paiement
app.post("/api/payment/confirm", async (req, res) => {
  try {
    const { transaction_id, user_id } = req.body;

    if (!transaction_id || !user_id) {
      return res.status(400).json({
        success: false,
        error: "Transaction ID et User ID requis",
      });
    }

    // 1. Mettre à jour le statut du paiement
    await supabase
      .from("payments")
      .update({
        status: "completed",
        updated_at: new Date(),
      })
      .eq("transaction_id", transaction_id);

    // 2. Activer l'utilisateur
    await supabase
      .from("users")
      .update({ status: "active" })
      .eq("id", user_id);

    // 3. Activer l'étudiant étranger
    await supabase
      .from("foreign_students")
      .update({
        subscription_status: "active",
      })
      .eq("id", user_id);

    res.json({
      success: true,
      message: "Paiement confirmé, compte activé",
    });
  } catch (error) {
    console.error("Erreur confirmation paiement:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});