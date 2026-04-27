import supabase from './database.js';

async function checkUsers() {
    const { data, error } = await supabase
        .from('utilisateurs')
        .select('email, role, prenom, nom');
    
    if (error) {
        console.error("Error:", error.message);
        return;
    }
    
    console.log("Registered Users:");
    console.table(data);
    process.exit();
}

checkUsers();
