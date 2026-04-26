import supabase from '../database.js';

async function checkUsers() {
    try {
        const { data, error } = await supabase
            .from('utilisateurs')
            .select('email, prenom, nom');
        
        if (error) {
            console.error('Error fetching users:', error);
            return;
        }
        
        if (data && data.length > 0) {
            console.log('Registered users found:');
            data.forEach(user => {
                console.log(`- ${user.prenom} ${user.nom} (${user.email})`);
            });
        } else {
            console.log('No users found in the database.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    } finally {
        process.exit();
    }
}

checkUsers();
