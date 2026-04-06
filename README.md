# InstitutEdu — Backend (Faculté)

Description
---
InstitutEdu est une plateforme de cours et examens destinée aux étudiants de l’institut — centralise cours, TD, séries d'exercices et sujets d'examen. Ce dépôt contient le backend minimal en Node.js/Express avec des données simulées (stockage en mémoire) et une API REST pour consulter et gérer les ressources.

Tech stack
---
- Node.js (recommandé ≥ 16)
- npm
- Express
- CORS
- nodemon (dev)

Fichiers importants
---
- `server.js` — serveur Express et routes API (données en mémoire).
- `package.json` — dépendances et scripts.
- `API.md` — documentation complète des endpoints.
- `index.html` — présent mais vide pour l'instant.
- `interface.png` — capture d'écran/maquette (optionnelle).

Prérequis
---
- Node.js et npm installés

Installation & exécution
---
1. Cloner le dépôt :
   git clone https://github.com/hmaida11/projet-DEV-WEB.git
   cd projet-DEV-WEB

2. Installer les dépendances :
   npm install

3. Lancer le serveur :
   - En production : npm start
   - En développement (hot reload) : npm run dev

Le serveur écoute par défaut sur http://localhost:3000

Utilisation / Tests rapides
---
Exemples curl :
- Lister les sections :
  curl http://localhost:3000/api/sections

- Lister les niveaux :
  curl http://localhost:3000/api/niveaux

- Récupérer toutes les ressources :
  curl "http://localhost:3000/api/ressources"

- Recherche filtrée :
  curl "http://localhost:3000/api/ressources?q=algèbre&section=Sciences&niveau=Licence%201"

- Détail d'une ressource :
  curl http://localhost:3000/api/ressources/1

- Login simulé :
  curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"ahmed@univ.tn","password":"1234"}'

Points importants pour la validation du projet
---
- Vérifier que `server.js` démarre sans erreur et sert les routes listées dans `API.md`.
- Vérifier `npm install` puis `npm start` (ou `npm run dev`).
- Tester au moins les endpoints principaux : sections, niveaux, ressources (liste + filtre), ressource par id, login.
- S'assurer que la documentation (`API.md`) couvre tous les endpoints et exemples.
- Ajouter un `.gitignore` contenant `node_modules/` si manquant.
- (Optionnel) Compléter `index.html` ou fournir une petite interface front qui consomme l'API.

Notes d'implémentation et limitations
---
- Le backend utilise des données en mémoire : aucun stockage persistant — redémarrage réinitialise l'état (historique, fichiers téléchargés).
- Authentification simulée : mot de passe commun `1234`, retourne un token factice.
- Pour production, prévoir : base de données, gestion réelle des utilisateurs, validation d'input, gestion d'erreurs centralisée.

Contribuer
---
- Ouvrez une issue pour signaler un bug ou demander une fonctionnalité.
- Forkez, créez une branche, faites vos changements et ouvrez un pull request.

Licence
---
MIT (ou choisissez la licence adéquate pour votre projet)

Contact
---
Auteur du dépôt: hmaida11  
Pour questions: utilisez les issues du dépôt.
