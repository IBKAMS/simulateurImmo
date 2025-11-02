const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware de protection des routes
const protect = async (req, res, next) => {
  let token;

  // Vérifier si le token est présent dans les headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extraire le token
      token = req.headers.authorization.split(' ')[1];

      // Vérifier et décoder le token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'votre_cle_secrete_tres_securisee_2024_aliz_strategy'
      );

      // Récupérer l'utilisateur depuis la base de données (sans le mot de passe)
      req.user = await User.findById(decoded._id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé, veuillez vous reconnecter'
        });
      }

      // Vérifier si le compte est actif
      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Votre compte a été désactivé'
        });
      }

      next();
    } catch (error) {
      console.error('Erreur d\'authentification:', error);

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token invalide, veuillez vous reconnecter'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Votre session a expiré, veuillez vous reconnecter'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }
  }

  // Si aucun token n'est fourni
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Accès refusé. Aucun token fourni'
    });
  }
};

// Middleware pour vérifier le rôle admin
const adminOnly = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }
};

// Middleware optionnel pour l'authentification (ne bloque pas si pas de token)
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'votre_cle_secrete_tres_securisee_2024_aliz_strategy'
      );
      req.user = await User.findById(decoded._id).select('-password');
    } catch (error) {
      // Si le token est invalide, on continue sans utilisateur
      req.user = null;
    }
  }

  next();
};

module.exports = {
  protect,
  adminOnly,
  optionalAuth
};