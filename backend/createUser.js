const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/simulateur-immo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createUser() {
  try {
    // Supprimer l'ancien utilisateur s'il existe
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Supprimer l'ancien
    await usersCollection.deleteOne({ email: 'aidriss01@gmail.com' });
    console.log('✅ Ancien utilisateur supprimé');

    // Créer le nouveau avec un mot de passe hashé simple
    // Le hash ci-dessous est pour le mot de passe: Admin123
    const newUser = {
      nom: 'KOUAKOU',
      prenom: 'Aidriss',
      email: 'aidriss01@gmail.com',
      telephone: '+225 0000000000',
      entreprise: 'ALIZ STRATEGY',
      fonction: 'Admin',
      // Ce hash correspond au mot de passe "Admin123" hashé avec bcrypt
      password: '$2a$10$HqWZhVGlE5iOYkQHRoOWqOJNhCBH/ZaCJezRhLgQkTsN5Qhe4sUJ.',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await usersCollection.insertOne(newUser);
    console.log('✅ Nouvel utilisateur créé');

    console.log('\n📧 IDENTIFIANTS DE CONNEXION :');
    console.log('================================');
    console.log('Email: aidriss01@gmail.com');
    console.log('Mot de passe: Admin123');
    console.log('================================');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

createUser();