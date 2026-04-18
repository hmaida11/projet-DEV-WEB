import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from "@supabase/supabase-js";

// Ces deux lignes servent à trouver le chemin exact sous Windows
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On force la lecture du fichier .env au bon endroit
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// LOG DE DÉBOGAGE (pour voir ce qui se passe)
console.log("Tentative de connexion avec URL :", supabaseUrl ? "Détectée ✅" : "VIDE ❌");

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Les clés Supabase sont manquantes dans le fichier .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;