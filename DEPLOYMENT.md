# Guide de Déploiement - Simulateur Tarification Immobilière

## Architecture de Déploiement

- **Frontend** : Vercel (https://simulateur-immo-swart.vercel.app)
- **Backend** : Render (https://votre-app.onrender.com)
- **Base de données** : MongoDB Atlas

## Configuration des Variables d'Environnement

### 🔧 Backend (Render)

Dans votre dashboard Render, configurez ces variables :

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=votre_cle_secrete_tres_securisee_2024
JWT_EXPIRE=7d
NODE_ENV=production
PORT=5000
```

### 🎨 Frontend (Vercel)

Dans votre dashboard Vercel, configurez cette variable :

```
REACT_APP_API_URL=https://votre-app.onrender.com
```

**Important** : Remplacez `votre-app.onrender.com` par l'URL réelle de votre backend Render.

## Étapes de Déploiement

### 1. Backend sur Render

1. Connectez votre repository GitHub à Render
2. Sélectionnez le dossier `backend` comme racine
3. Build command : `npm install`
4. Start command : `node server.js`
5. Ajoutez les variables d'environnement listées ci-dessus
6. Déployez

### 2. Frontend sur Vercel

1. Connectez votre repository GitHub à Vercel
2. Sélectionnez le dossier `frontend` comme racine
3. Framework : Create React App
4. Build command : `npm run build`
5. Output directory : `build`
6. Ajoutez la variable d'environnement `REACT_APP_API_URL`
7. Déployez

### 3. MongoDB Atlas

1. Créez un cluster gratuit sur MongoDB Atlas
2. Créez un utilisateur de base de données
3. Whitelist les IP (ou autorisez toutes les IP : 0.0.0.0/0 pour Render/Vercel)
4. Copiez la chaîne de connexion dans la variable `MONGO_URI` de Render

## Configuration CORS

Le backend est configuré pour accepter les requêtes de :
- `http://localhost:3000` (développement)
- `https://simulateur-immo-swart.vercel.app` (production)

Si vous changez l'URL Vercel, mettez à jour `backend/server.js` ligne 16.

## Vérification du Déploiement

### Backend
Visitez : `https://votre-app.onrender.com`
Vous devriez voir : `{"message":"Le serveur fonctionne !"}`

### Frontend
Visitez : `https://simulateur-immo-swart.vercel.app`
Vous devriez voir la page de connexion.

## Troubleshooting

### Erreur CORS
- Vérifiez que l'URL Vercel est dans la liste `allowedOrigins` du backend
- Vérifiez les logs Render pour voir les origines bloquées

### Erreur de connexion MongoDB
- Vérifiez que `MONGO_URI` est bien configuré sur Render
- Vérifiez que les IP sont autorisées dans MongoDB Atlas

### Network Error depuis Vercel
- Vérifiez que `REACT_APP_API_URL` est configuré sur Vercel
- Vérifiez que l'URL pointe bien vers votre backend Render
