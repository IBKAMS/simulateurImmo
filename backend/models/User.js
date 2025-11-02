const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir un email valide'
    ]
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas inclure le mot de passe par défaut dans les requêtes
  },
  nom: {
    type: String,
    trim: true
  },
  prenom: {
    type: String,
    trim: true
  },
  entreprise: {
    type: String,
    trim: true
  },
  telephone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  dateInscription: {
    type: Date,
    default: Date.now
  },
  derniereConnexion: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
});

// Index pour optimiser les recherches par email
UserSchema.index({ email: 1 });

// Middleware pour hacher le mot de passe avant la sauvegarde
UserSchema.pre('save', async function(next) {
  // Ne hacher que si le mot de passe a été modifié
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Générer un salt et hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer le mot de passe
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison des mots de passe');
  }
};

// Méthode pour générer un JWT
UserSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET || 'votre_cle_secrete_tres_securisee_2024_aliz_strategy',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
  return token;
};

// Méthode pour mettre à jour la dernière connexion
UserSchema.methods.updateLastLogin = async function() {
  this.derniereConnexion = Date.now();
  await this.save({ validateBeforeSave: false });
};

// Méthode statique pour trouver un utilisateur par ses identifiants
UserSchema.statics.findByCredentials = async function(email, password) {
  // Rechercher l'utilisateur par email (inclure le mot de passe)
  const user = await this.findOne({ email }).select('+password');

  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  // Vérifier si le compte est actif
  if (!user.isActive) {
    throw new Error('Votre compte a été désactivé');
  }

  // Vérifier le mot de passe
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    throw new Error('Email ou mot de passe incorrect');
  }

  return user;
};

// Méthode virtuelle pour obtenir le nom complet
UserSchema.virtual('nomComplet').get(function() {
  if (this.prenom && this.nom) {
    return `${this.prenom} ${this.nom}`;
  }
  return this.email;
});

// Méthode pour générer un token de réinitialisation de mot de passe
UserSchema.methods.generatePasswordResetToken = function() {
  // Générer un token aléatoire
  const resetToken = require('crypto').randomBytes(20).toString('hex');

  // Hacher le token et le stocker dans la base
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Définir l'expiration (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Configuration de la transformation JSON (suppression du mot de passe)
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    return ret;
  }
});

// Export du modèle
module.exports = mongoose.model('User', UserSchema);