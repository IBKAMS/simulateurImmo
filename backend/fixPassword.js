const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/simulateur-immo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');

async function fixPassword() {
  try {
    const email = 'aidriss01@gmail.com';
    const newPassword = 'Test123456';  // Mot de passe simple pour le test

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mise à jour directe dans la base de données
    const result = await User.updateOne(
      { email: email },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      console.log('❌ Utilisateur non trouvé');

      // Créer l'utilisateur s'il n'existe pas
      const newUser = new User({
        nom: 'KOUAKOU',
        prenom: 'Aidriss',
        email: 'aidriss01@gmail.com',
        telephone: '+225 0000000000',
        entreprise: 'ALIZ STRATEGY',
        fonction: 'Admin',
        password: hashedPassword
      });

      await newUser.save();
      console.log('✅ Utilisateur créé avec succès');
    } else {
      console.log('✅ Mot de passe mis à jour avec succès');
    }

    // Vérifier que le mot de passe fonctionne
    const user = await User.findOne({ email: email });
    const isValid = await bcrypt.compare(newPassword, user.password);

    console.log('\n📧 NOUVEAUX IDENTIFIANTS DE CONNEXION :');
    console.log('================================');
    console.log('Email: aidriss01@gmail.com');
    console.log('Mot de passe: Test123456');
    console.log('================================');
    console.log('\n🔐 Vérification:', isValid ? '✅ Le mot de passe est valide' : '❌ Erreur');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

fixPassword();