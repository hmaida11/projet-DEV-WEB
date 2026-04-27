-- 1. Création de la base de données
CREATE DATABASE IF NOT EXISTS faculte_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE faculte_db;

-- 2. Table des codes académiques valides (pour élèves et profs)
-- Cette table contient les codes de 7 chiffres générés par l'administration
CREATE TABLE codes_academiques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code_valide INT(7) UNIQUE NOT NULL,
    type_code ENUM('etudiant', 'prof') DEFAULT 'etudiant', -- Nouveau: Distinction entre prof et étudiant
    est_utilise BOOLEAN DEFAULT FALSE,
    date_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table des utilisateurs
CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(100) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email2 VARCHAR(255), -- البريد الإلكتروني الثاني الاختياري
    password VARCHAR(255) NOT NULL, -- Stocké en hash (password_hash)
    
    -- Type: 'interne' (gratuit) ou 'etranger' (payant)
    type_utilisateur ENUM('interne', 'etranger') NOT NULL,
    
    -- Référence au code d'inscription (si interne)
    code_inscription_utilise INT(7) NULL,
    
    -- Statut du compte: 'actif', 'suspendu', 'en_attente'
    statut ENUM('actif', 'suspendu', 'en_attente') DEFAULT 'actif',
    
    avatar_url TEXT, -- رابط الصورة الشخصية
    niveau VARCHAR(100), -- سنة الدراسة
    section VARCHAR(100), -- الشعبة
    
    -- Nouveau: Rôle de l'utilisateur (déterminé par le code lors de l'inscription)
    role ENUM('etudiant', 'prof') DEFAULT 'etudiant',
    
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
-- Insertion de quelques codes d'inscription valides
INSERT INTO codes_academiques (code_valide, type_code) VALUES 
(1234567, 'etudiant'), -- Code pour un étudiant
(7654321, 'etudiant'), 
(9999001, 'prof'),     -- Code pour un professeur
(9999002, 'prof');

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