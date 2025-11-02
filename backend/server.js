const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Configuration des variables d'environnement
dotenv.config();

// Initialisation de l'application Express
const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:3000', // URL du frontend React
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration de MongoDB
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/simulateur-immo';

// Connexion à MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Connexion à MongoDB réussie'))
  .catch((err) => console.error('❌ Erreur de connexion MongoDB:', err));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Le serveur fonctionne !' });
});

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/simulations', require('./routes/simulations'));

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Port d'écoute
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
});