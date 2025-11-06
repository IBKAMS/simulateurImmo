const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/simulateur-immo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');

async function fixUserAuth() {
  try {
    // Attendre que la connexion soit établie
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('open', resolve);
      }
    });

    console.log('✅ Connecté à MongoDB');

    const email = 'aidriss01@gmail.com';
    const newPassword = 'ImmoAliz2024';  // Nouveau mot de passe simple

    // Vérifier si l'utilisateur existe
    let user = await User.findOne({ email });

    if (!user) {
      console.log('❌ Utilisateur non trouvé, création...');

      // Créer l'utilisateur avec le mot de passe en clair
      // Le middleware du modèle le hashera automatiquement
      user = new User({
        nom: 'KOUAKOU',
        prenom: 'Aidriss',
        email: email,
        telephone: '+225 0000000000',
        entreprise: 'ALIZ STRATEGY',
        fonction: 'Admin',
        password: newPassword  // Mot de passe en clair, sera hashé par le middleware
      });

      await user.save();
      console.log('✅ Utilisateur créé avec succès');
    } else {
      console.log('✅ Utilisateur trouvé, mise à jour du mot de passe...');

      // Mettre à jour le mot de passe en clair
      // Le middleware du modèle le hashera automatiquement
      user.password = newPassword;
      await user.save();
      console.log('✅ Mot de passe mis à jour avec succès');
    }

    // Vérifier que le mot de passe fonctionne avec la méthode du modèle
    const userTest = await User.findOne({ email }).select('+password');
    if (userTest) {
      const isValid = await userTest.comparePassword(newPassword);
      console.log('\n🔐 Test de vérification avec comparePassword:', isValid ? '✅ Le mot de passe est valide' : '❌ Erreur');

      // Test également avec findByCredentials
      try {
        const authUser = await User.findByCredentials(email, newPassword);
        console.log('🔐 Test de connexion avec findByCredentials: ✅ Connexion réussie');
      } catch (err) {
        console.log('🔐 Test de connexion avec findByCredentials: ❌', err.message);
      }
    }

    console.log('\n📧 IDENTIFIANTS DE CONNEXION :');
    console.log('================================');
    console.log(`Email: ${email}`);
    console.log(`Mot de passe: ${newPassword}`);
    console.log('================================');
    console.log('\nVous pouvez maintenant vous connecter sur http://localhost:3000');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    setTimeout(() => {
      mongoose.connection.close();
      process.exit(0);
    }, 1000);
  }
}

fixUserAuth();