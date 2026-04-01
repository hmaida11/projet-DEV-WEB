# 📚 Faculté Backend — Documentation API

## Installation

```bash
npm install
npm run dev     # avec nodemon (hot reload)
# ou
npm start       # production
```

Serveur lancé sur → `http://localhost:3000`

---

## Routes disponibles

### 🔐 Authentification

| Méthode | Route             | Description                          |
|---------|-------------------|--------------------------------------|
| POST    | `/api/auth/login` | Connexion (mot de passe simulé: `1234`) |
| POST    | `/api/auth/logout`| Déconnexion                          |

**Exemple login :**
```json
POST /api/auth/login
{ "email": "ahmed@univ.tn", "password": "1234" }
```

---

### 📂 Sections & Niveaux (Sidebar)

| Méthode | Route            | Description              |
|---------|------------------|--------------------------|
| GET     | `/api/sections`  | Liste : Sciences, Lettres, Droit, Économie |
| GET     | `/api/niveaux`   | Liste : Licence 1 → Doctorat |
| GET     | `/api/categories`| Liste des 4 catégories de cards |

---

### 📖 Ressources (Cards principales)

| Méthode | Route                        | Description                             |
|---------|------------------------------|-----------------------------------------|
| GET     | `/api/ressources`            | Toutes les ressources (avec filtres)    |
| GET     | `/api/ressources/:id`        | Détail d'une ressource                  |
| GET     | `/api/ressources/type/:type` | Par type : `exercices`, `examens`, `cours`, `td` |

**Paramètres de recherche (`/api/ressources`) :**

| Param      | Description                           | Exemple             |
|------------|---------------------------------------|---------------------|
| `q`        | Recherche textuelle (titre/description)| `?q=algèbre`       |
| `categorie`| Filtre catégorie (label complet)      | `?categorie=Cours+%26+Supports` |
| `section`  | Filtre section                        | `?section=Sciences` |
| `niveau`   | Filtre niveau                         | `?niveau=Licence+1` |
| `userId`   | Sauvegarde dans l'historique          | `?userId=1`         |

**Exemple :**
```
GET /api/ressources?q=exam&section=Droit&niveau=Licence 2&userId=3
```

---

### 👤 Profil utilisateur

| Méthode | Route                    | Description              |
|---------|--------------------------|--------------------------|
| GET     | `/api/users/:id/profil`  | Récupérer le profil       |
| PUT     | `/api/users/:id/profil`  | Modifier le profil        |

---

### 🕓 Historique de Recherche

| Méthode | Route                        | Description              |
|---------|------------------------------|--------------------------|
| GET     | `/api/users/:id/historique`  | Voir l'historique        |
| DELETE  | `/api/users/:id/historique`  | Effacer l'historique     |

---

### 💾 Fichiers Installés

| Méthode | Route                                    | Description              |
|---------|------------------------------------------|--------------------------|
| GET     | `/api/users/:id/fichiers`                | Liste des fichiers       |
| POST    | `/api/users/:id/fichiers`                | Ajouter un fichier       |
| DELETE  | `/api/users/:id/fichiers/:ressourceId`   | Supprimer un fichier     |

**Exemple ajout :**
```json
POST /api/users/1/fichiers
{ "ressourceId": 5 }
```

---

## Utilisateurs de test

| ID | Email              | Rôle     | Niveau    |
|----|--------------------|----------|-----------|
| 1  | ahmed@univ.tn      | etudiant | Licence 2 |
| 2  | fatma@univ.tn      | etudiant | Master    |
| 3  | karim@univ.tn      | etudiant | Licence 1 |
| 4  | nadia@univ.tn      | admin    | —         |

> Mot de passe pour tous : **1234**
