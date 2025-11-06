const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/simulateur-immo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');

async function checkAndResetUser() {
  try {
    // Vérifier si l'utilisateur existe
    let user = await User.findOne({ email: 'aidriss01@gmail.com' });

    if (!user) {
      console.log('❌ Utilisateur non trouvé, création en cours...');

      // Créer l'utilisateur
      const hashedPassword = await bcrypt.hash('SimuImmo2024!', 10);
      user = new User({
        nom: 'KOUAKOU',
        prenom: 'Aidriss',
        email: 'aidriss01@gmail.com',
        telephone: '+225 0000000000',
        entreprise: 'ALIZ STRATEGY',
        fonction: 'Admin',
        password: hashedPassword
      });

      await user.save();
      console.log('✅ Utilisateur créé avec succès');
    } else {
      console.log('✅ Utilisateur trouvé, mise à jour du mot de passe...');

      // Mettre à jour le mot de passe
      const hashedPassword = await bcrypt.hash('SimuImmo2024!', 10);
      user.password = hashedPassword;
      await user.save();

      console.log('✅ Mot de passe mis à jour');
    }

    console.log('\n📧 Identifiants de connexion :');
    console.log('Email: aidriss01@gmail.com');
    console.log('Mot de passe: SimuImmo2024!');

    // Test de vérification
    const isValid = await bcrypt.compare('SimuImmo2024!', user.password);
    console.log('\n🔐 Test de vérification du mot de passe:', isValid ? '✅ Valide' : '❌ Invalide');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkAndResetUser();