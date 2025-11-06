const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Validation des données d'inscription
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/\d/)
    .withMessage('Le mot de passe doit contenir au moins un chiffre'),
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  body('prenom')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le prénom doit contenir au moins 2 caractères'),
  body('entreprise')
    .optional()
    .trim(),
  body('telephone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Numéro de téléphone invalide')
];

// Validation des données de connexion
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

// @route   POST /api/auth/register
// @desc    Inscription d'un nouvel utilisateur
// @access  Public
router.post('/register', validateRegister, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, nom, prenom, entreprise, telephone } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un compte existe déjà avec cet email'
      });
    }

    // Créer un nouvel utilisateur
    const user = await User.create({
      email,
      password,
      nom,
      prenom,
      entreprise,
      telephone
    });

    // Générer le token JWT
    const token = user.generateAuthToken();

    // Réponse avec le token et les infos utilisateur
    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        entreprise: user.entreprise,
        role: user.role
      },
      message: 'Inscription réussie !'
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Connexion d'un utilisateur
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur et vérifier le mot de passe
    const user = await User.findByCredentials(email, password);

    // Mettre à jour la dernière connexion
    await user.updateLastLogin();

    // Générer le token JWT
    const token = user.generateAuthToken();

    // Réponse avec le token et les infos utilisateur
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        entreprise: user.entreprise,
        role: user.role
      },
      message: 'Connexion réussie !'
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Email ou mot de passe incorrect'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        _id: req.user._id,
        email: req.user.email,
        nom: req.user.nom,
        prenom: req.user.prenom,
        entreprise: req.user.entreprise,
        telephone: req.user.telephone,
        role: req.user.role,
        dateInscription: req.user.dateInscription,
        derniereConnexion: req.user.derniereConnexion
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// @route   PUT /api/auth/updateprofile
// @desc    Mettre à jour le profil de l'utilisateur
// @access  Private
router.put('/updateprofile', protect, [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  body('prenom')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le prénom doit contenir au moins 2 caractères'),
  body('entreprise')
    .optional()
    .trim(),
  body('telephone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Numéro de téléphone invalide')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nom, prenom, entreprise, telephone } = req.body;

    // Mettre à jour les informations de l'utilisateur
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        nom,
        prenom,
        entreprise,
        telephone
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        entreprise: user.entreprise,
        telephone: user.telephone,
        role: user.role
      },
      message: 'Profil mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// @route   PUT /api/auth/changepassword
// @desc    Changer le mot de passe
// @access  Private
router.put('/changepassword', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
    .matches(/\d/)
    .withMessage('Le nouveau mot de passe doit contenir au moins un chiffre')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findById(req.user._id).select('+password');

    // Vérifier le mot de passe actuel
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    // Générer un nouveau token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      token,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Déconnexion (côté client principalement)
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // La déconnexion est principalement gérée côté client en supprimant le token
    // Ici, nous pouvons simplement confirmer la déconnexion
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Demander une réinitialisation de mot de passe
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      return res.json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.'
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Sauvegarder le token haché et sa date d'expiration (1 heure)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 heure
    await user.save();

    // URL de réinitialisation (à adapter selon votre configuration)
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    // Dans un environnement de production, vous devriez envoyer un email
    // Pour le développement, nous retournons le lien directement
    console.log('Lien de réinitialisation:', resetUrl);
    console.log('Token (pour dev):', resetToken);

    res.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      // En développement uniquement - à retirer en production !
      resetUrl: resetUrl,
      token: resetToken
    });

  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation'
    });
  }
});

// @route   GET /api/auth/reset-password/:token
// @desc    Vérifier le token de réinitialisation
// @access  Public
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Hacher le token reçu
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Trouver l'utilisateur avec ce token et vérifier qu'il n'est pas expiré
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    res.json({
      success: true,
      message: 'Token valide'
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token'
    });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Réinitialiser le mot de passe
// @access  Public
router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/\d/)
    .withMessage('Le mot de passe doit contenir au moins un chiffre')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Hacher le token reçu
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Trouver l'utilisateur avec ce token et vérifier qu'il n'est pas expiré
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Mettre à jour le mot de passe
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Générer un token d'authentification
    const authToken = user.generateAuthToken();

    res.json({
      success: true,
      token: authToken,
      user: {
        _id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        entreprise: user.entreprise,
        role: user.role
      },
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe'
    });
  }
});

module.exports = router;