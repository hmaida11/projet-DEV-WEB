<?php
// --- Connexion sécurisée à la BD ---
$host = 'localhost';
$db   = 'faculte_db';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
try {
     $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (\PDOException $e) {
     die("Erreur de connexion : " . $e->getMessage());
}

$action = $_POST['action'] ?? '';

// 1. LOGIN
if ($action === 'login') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        echo "<h1>Succès</h1><p>Connexion en cours...</p>";
        // Redirection vers le tableau de bord ici
    } else {
        echo "Gmail introuvable ou mot de passe incorrect.";
    }
}

// 2. REGISTER
if ($action === 'register') {
    $email = $_POST['email'];
    $type = $_POST['user_type'];
    $pass = password_hash($_POST['password'], PASSWORD_DEFAULT);

    if ($type === 'interne') {
        $code = $_POST['code'];
        // Vérifie si le code int(7) existe
        $stmt = $pdo->prepare("SELECT * FROM codes_academiques WHERE code_num = ?");
        $stmt->execute([$code]);
        if (!$stmt->fetch()) {
            die("Erreur : Ce code d'inscription n'existe pas.");
        }
        $status = 'Gratuit (Étudiant)';
    } else {
        $status = 'Payant (Abonnement mensuel)';
    }

    $stmt = $pdo->prepare("INSERT INTO utilisateurs (prenom, nom, email, password, status) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$_POST['prenom'], $_POST['nom'], $email, $pass, $status]);
    
    echo "Compte créé ! Bienvenue dans la communauté.";
}

// 3. RESET (Changement direct si email trouvé)
if ($action === 'reset') {
    $email = $_POST['email'];
    $new_pass = password_hash($_POST['new_password'], PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("UPDATE utilisateurs SET password = ? WHERE email = ?");
    $stmt->execute([$new_pass, $email]);

    if ($stmt->rowCount() > 0) {
        echo "Mot de passe mis à jour avec succès.";
    } else {
        echo "Email non trouvé dans la base.";
    }
}
// Exemple de vérification de code avant insertion
$codeSaisi = $_POST['code']; 

$query = $pdo->prepare("SELECT * FROM codes_academiques WHERE code_valide = ? AND est_utilise = FALSE");
$query->execute([$codeSaisi]);

if ($query->rowCount() > 0) {
    // Le code est bon ! On peut créer le compte gratuit
} else {
    // Code invalide ou déjà utilisé
}
// ... connexion PDO existante ...

if ($_POST['action'] === 'register') {
    $prenom = $_POST['prenom'];
    $nom = $_POST['nom'];
    $email = $_POST['email'];
    $pass = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $type = $_POST['user_type'];

    // Insertion
    $stmt = $pdo->prepare("INSERT INTO utilisateurs (prenom, nom, email, password, type_utilisateur) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$prenom, $nom, $email, $pass, $type]);

    // Redirection vers le login avec un message de succès
    echo "<script>
            alert('Compte créé avec succès ! Connectez-vous.');
            window.location.href = 'index.html'; 
          </script>";
}
?>