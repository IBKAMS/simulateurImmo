# 🏗️ SIMULATEUR DE TARIFICATION IMMOBILIÈRE - ALIZ STRATEGY

Application web complète de simulation tarifaire pour projets immobiliers, avec authentification des utilisateurs et sauvegarde en base de données.

## 🚀 Architecture

- **Backend**: Node.js + Express.js + MongoDB
- **Frontend**: React.js
- **Authentification**: JWT (JSON Web Tokens)
- **Sécurité**: Bcryptjs pour le hachage des mots de passe

## 📋 Prérequis

1. **Node.js** (version 14 ou supérieure)
2. **MongoDB** installé et en cours d'exécution
3. **NPM** ou **Yarn**

## 🛠️ Installation

### 1. Installer MongoDB (si pas déjà installé)

```bash
# Sur macOS avec Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### 2. Installer les dépendances

Dans le dossier principal du projet:

```bash
# Installer les dépendances du projet principal
npm install

# Installer les dépendances du backend
cd backend
npm install

# Installer les dépendances du frontend
cd ../frontend
npm install
```

## 🚀 Démarrage de l'Application

### Option 1: Démarrage séparé (recommandé pour le développement)

**Terminal 1 - MongoDB:**
```bash
# Assurez-vous que MongoDB est démarré
brew services start mongodb-community
# ou
mongod
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```
Le serveur backend démarrera sur http://localhost:5000

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```
L'application React démarrera sur http://localhost:3000

### Option 2: Démarrage simultané

Depuis la racine du projet:
```bash
npm run dev
```
Cette commande démarre le backend et le frontend simultanément.

## 📌 Accès à l'Application

1. Ouvrez votre navigateur
2. Allez à: **http://localhost:3000**
3. Créez un compte ou connectez-vous

## 🔐 Informations de Connexion Test

Pour tester rapidement, vous pouvez créer un compte avec:
- **Email**: test@example.com
- **Mot de passe**: Test123 (minimum 6 caractères avec au moins 1 chiffre)

## 📊 Fonctionnalités Principales

### 1. **Authentification**
- Inscription sécurisée
- Connexion avec JWT
- Protection des routes
- Déconnexion

### 2. **Configuration du Projet**
- Nom et localisation
- Type de zone (stratégique, premium, standard, économique)
- Typologie des biens (villas, duplex, triplex)
- Paramètres fonciers

### 3. **Analyse des Coûts**
- Coûts de construction par type
- Frais additionnels (VRD, études, financiers)
- TVA configurable

### 4. **Stratégie de Prix**
- 4 niveaux de marge personnalisables
- Stratégie de phasage
- Analyse comparative

### 5. **Simulation Financière**
- Calcul automatique du ROI
- Graphiques interactifs
- Tableaux de synthèse
- Export des résultats

### 6. **Tableau de Bord**
- Liste des simulations sauvegardées
- Statistiques globales
- Actions: voir, dupliquer, supprimer
- Changement de statut

## 🐛 Dépannage

### MongoDB ne démarre pas
```bash
# Vérifier le statut
brew services list

# Redémarrer MongoDB
brew services restart mongodb-community

# Vérifier les logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

### Port déjà utilisé
```bash
# Trouver et tuer le processus sur le port 5000
lsof -i :5000
kill -9 [PID]

# Trouver et tuer le processus sur le port 3000
lsof -i :3000
kill -9 [PID]
```

### Erreur CORS
Vérifiez que le backend est bien démarré sur le port 5000 et que le proxy est configuré dans frontend/package.json

## 📂 Structure du Projet

```
SIMULATEUR TARIFICATION IMMO/
├── backend/
│   ├── models/          # Modèles Mongoose
│   ├── routes/          # Routes API
│   ├── middleware/      # Middlewares (auth JWT)
│   └── server.js        # Serveur Express
├── frontend/
│   ├── public/          # Fichiers publics
│   └── src/
│       ├── components/  # Composants React
│       ├── services/    # Services API
│       └── App.js       # Composant principal
└── README.md
```

## 🔧 Variables d'Environnement

Créez ou modifiez le fichier `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/simulateur-immo
PORT=5000
NODE_ENV=development
JWT_SECRET=votre_cle_secrete_tres_securisee_2024_aliz_strategy
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

## 🚀 Déploiement

### Pour la Production

1. **Backend**: Peut être déployé sur Heroku, Railway, ou Render
2. **Frontend**: Peut être déployé sur Vercel, Netlify, ou GitHub Pages
3. **Base de données**: MongoDB Atlas (version cloud)

### Build de Production

```bash
# Frontend
cd frontend
npm run build

# Les fichiers de production seront dans frontend/build
```

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte à tous les écrans:
- 📱 Mobile
- 📱 Tablette
- 💻 Desktop

## 🤝 Support

Pour toute question ou problème:
- Email: support@alizstrategy.com
- Documentation: [En cours de rédaction]

## 📄 Licence

© 2025 ALIZ STRATEGY - Tous droits réservés

---

**Développé avec ❤️ par ALIZ STRATEGY**