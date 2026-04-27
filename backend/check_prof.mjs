import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listProfs() {
  console.log("🔍 Checking for professor accounts...");
  
  const { data, error } = await supabase
    .from('users')
    .select('email, role, type')
    .eq('type', 'professeur_interne');
    
  if (error) {
    console.error("❌ Error fetching users:", error.message);
  } else {
    if (data.length === 0) {
      console.log("📭 No professor accounts found.");
    } else {
      console.log(`✅ Found ${data.length} professor(s):`);
      data.forEach(u => console.log(`- ${u.email} (Type: ${u.type})`));
    }
  }
}

listProfs();
