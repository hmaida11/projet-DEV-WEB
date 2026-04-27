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

async function initStorage() {
  console.log("🛠️ Checking Supabase Storage bucket...");
  
  const { data, error } = await supabase.storage.getBucket('ressources');
  
  if (error && error.message.includes('not found')) {
    console.log("Bucket 'ressources' not found. Creating it...");
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('ressources', {
      public: true,
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      fileSizeLimit: 20971520 // 20MB
    });
    
    if (createError) {
      console.error("❌ Error creating bucket:", createError.message);
    } else {
      console.log("✅ Bucket 'ressources' created successfully.");
    }
  } else if (error) {
    console.error("❌ Error checking bucket:", error.message);
  } else {
    console.log("✅ Bucket 'ressources' already exists.");
  }
}

initStorage();
