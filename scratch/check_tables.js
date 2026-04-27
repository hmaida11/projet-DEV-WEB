import supabase from '../database.js';

async function listTables() {
    try {
        // Since Supabase JS doesn't have a direct "list tables" method for public use easily without admin, 
        // we can try to query some common names or use a trick if possible.
        // Actually, we can try to query the schema if we have service role key.
        
        const { data, error } = await supabase.rpc('get_tables'); // This assumes an RPC exists, which it probably doesn't.
        
        // Alternative: Try to query a hypothetical 'ressources' table to see if it exists.
        const { error: resError } = await supabase.from('ressources').select('id').limit(1);
        if (resError && resError.code === 'PGRST116') {
             console.log("Table 'ressources' exists but is empty.");
        } else if (resError && resError.code === '42P01') {
             console.log("Table 'ressources' does NOT exist.");
        } else if (!resError) {
             console.log("Table 'ressources' exists.");
        } else {
             console.log("Error checking 'ressources':", resError.message);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    } finally {
        process.exit();
    }
}

listTables();
