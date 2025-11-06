const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/simulateur-immo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');

async function resetPassword() {
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
    const newPassword = 'AlizStrategy2024';  // Nouveau mot de passe simple

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Mot de passe hashé généré');

    // Vérifier si l'utilisateur existe
    let user = await User.findOne({ email });

    if (!user) {
      console.log('❌ Utilisateur non trouvé, création...');

      // Créer l'utilisateur
      user = new User({
        nom: 'KOUAKOU',
        prenom: 'Aidriss',
        email: email,
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
      user.password = hashedPassword;
      await user.save();
      console.log('✅ Mot de passe mis à jour avec succès');
    }

    // Vérifier que le mot de passe fonctionne
    const isValid = await bcrypt.compare(newPassword, user.password);

    console.log('\n📧 IDENTIFIANTS DE CONNEXION :');
    console.log('================================');
    console.log(`Email: ${email}`);
    console.log(`Mot de passe: ${newPassword}`);
    console.log('================================');
    console.log('\n🔐 Test de vérification:', isValid ? '✅ Le mot de passe est valide' : '❌ Erreur de vérification');

    // Test de connexion supplémentaire
    const userTest = await User.findOne({ email }).select('+password');
    if (userTest) {
      const testValid = await bcrypt.compare(newPassword, userTest.password);
      console.log('🔐 Test supplémentaire:', testValid ? '✅ Connexion valide' : '❌ Échec');
    }

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

resetPassword();