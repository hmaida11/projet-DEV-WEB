-- 1. Création de la base de données
CREATE DATABASE IF NOT EXISTS faculte_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE faculte_db;

-- 2. Table des codes académiques valides (pour élèves et profs)
-- Cette table contient les codes de 7 chiffres générés par l'administration
CREATE TABLE codes_academiques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code_valide INT(7) UNIQUE NOT NULL,
    est_utilise BOOLEAN DEFAULT FALSE,
    date_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table des utilisateurs
CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Stocké en hash (password_hash)
    
    -- Type: 'interne' (gratuit) ou 'etranger' (payant)
    type_utilisateur ENUM('interne', 'etranger') NOT NULL,
    
    -- Référence au code d'inscription (si interne)
    code_inscription_utilise INT(7) NULL,
    
    -- Statut du compte: 'actif', 'suspendu' (si non payé), 'en_attente'
    statut_compte VARCHAR(20) DEFAULT 'actif',
    
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_code FOREIGN KEY (code_inscription_utilise) 
    REFERENCES codes_academiques(code_valide) ON DELETE SET NULL
);

-- 4. Table des Abonnements (Logique style Netflix/Spotify)
-- Pour suivre la validité des accès payants
CREATE TABLE abonnements_payants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin_validite DATE NOT NULL,
    montant_paye DECIMAL(10,2) NOT NULL,
    statut_paiement ENUM('succes', 'echec', 'en_attente') DEFAULT 'succes',
    
    FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- DONNÉES DE TEST (Jeu d'essai)
-- ---------------------------------------------------------

-- Insertion de quelques codes d'inscription à 7 chiffres valides
INSERT INTO codes_academiques (code_valide) VALUES 
(1234567), 
(7654321), 
(1112223), 
(9988776);

-- 5. Table des Ressources (Cours, Examens, etc.)
CREATE TABLE ressources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    type_ressource ENUM('exercices', 'examens', 'cours', 'td') NOT NULL,
    section VARCHAR(100) NOT NULL,
    niveau VARCHAR(100) NOT NULL,
    annee_universitaire VARCHAR(20) NOT NULL,
    url_fichier TEXT, -- Lien vers le fichier (Supabase Storage ou local)
    user_id INT, -- L'utilisateur qui a posté
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- Note : Lors de l'inscription d'un élève avec le code 1234567, 
-- vous devrez mettre à jour 'est_utilise' à TRUE.