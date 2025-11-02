const mongoose = require('mongoose');

const SimulationSchema = new mongoose.Schema({
  // Lien avec l'utilisateur
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Informations générales du projet
  nomProjet: {
    type: String,
    required: true,
    trim: true
  },
  localisation: {
    type: String,
    required: true,
    trim: true
  },
  typeZone: {
    type: String,
    enum: ['strategic', 'premium', 'standard', 'economic'],
    default: 'standard'
  },
  localisationCoefficient: {
    type: Number,
    required: true,
    default: 1.0
  },

  // Paramètres fonciers
  surfaceTotaleTerrain: {
    type: Number,
    required: true
  },
  coutFoncier: {
    type: Number,
    required: true
  },
  typeTitreFoncier: {
    type: String,
    enum: ['acd', 'permit', 'lease', 'title'],
    default: 'acd'
  },

  // Types de biens
  typologieBiens: [{
    nom: String,
    surfaceTerrain: Number,
    surfaceBati: Number,
    coutConstruction: Number,
    quantite: Number,
    coutTotal: Number,
    prix: {
      penetration: Number,
      target: Number,
      premium: Number,
      premiumPlus: Number
    },
    _id: false  // Désactive la création automatique d'_id pour les sous-documents
  }],

  // Coûts additionnels (en pourcentage)
  vrdCout: {
    type: Number,
    default: 10
  },
  fraisEtudes: {
    type: Number,
    default: 7
  },
  fraisFinanciers: {
    type: Number,
    default: 3
  },

  // Paramètres fiscaux
  tauxTVA: {
    type: Number,
    default: 18
  },

  // Marges commerciales
  marges: {
    penetration: {
      type: Number,
      default: 30
    },
    target: {
      type: Number,
      default: 60
    },
    premium: {
      type: Number,
      default: 80
    },
    premiumPlus: {
      type: Number,
      default: 100
    }
  },

  // Marges personnalisables
  customMargins: {
    level1: {
      type: Number,
      default: 30
    },
    level2: {
      type: Number,
      default: 60
    },
    level3: {
      type: Number,
      default: 80
    },
    level4: {
      type: Number,
      default: 100
    }
  },

  // Stratégie de phasage
  phasage: {
    phase1Percent: {
      type: Number,
      default: 30
    },
    phase2Percent: {
      type: Number,
      default: 35
    },
    phase3Percent: {
      type: Number,
      default: 35
    },
    phase2Increase: {
      type: Number,
      default: 5
    },
    phase3Increase: {
      type: Number,
      default: 10
    }
  },

  // Analyse concurrentielle
  concurrents: [{
    nom: String,
    localisation: String,
    prixMoyenM2: Number,
    positionnement: {
      type: String,
      enum: ['economic', 'standard', 'premium'],
      default: 'standard'
    },
    coefficient: {
      type: Number,
      default: 1.0
    },
    _id: false  // Désactive la création automatique d'_id pour les sous-documents
  }],

  // Résultats financiers calculés
  investissementTotal: {
    type: Number,
    required: true
  },
  chiffreAffairesProjete: {
    type: Number,
    required: true
  },
  margeNette: {
    type: Number,
    required: true
  },
  roi: {
    type: Number,
    required: true
  },

  // Métadonnées
  status: {
    type: String,
    enum: ['draft', 'validated', 'archived'],
    default: 'draft'
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour la date de modification
SimulationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode pour calculer les résultats financiers
SimulationSchema.methods.calculateFinancials = function() {
  let investissementTotal = 0;
  let chiffreAffaires = 0;

  // Calcul basé sur les typologies de biens
  this.typologieBiens.forEach(bien => {
    const coutTerrain = bien.surfaceTerrain * this.coutFoncier;
    const coutConstruction = bien.surfaceBati * bien.coutConstruction;
    const coutBase = coutTerrain + coutConstruction;
    const fraisAdditionnels = coutBase * ((this.vrdCout + this.fraisEtudes + this.fraisFinanciers) / 100);
    const coutTotalHT = coutBase + fraisAdditionnels;
    const coutTotalTTC = coutTotalHT * (1 + this.tauxTVA / 100);

    investissementTotal += coutTotalTTC * bien.quantite;

    // Utilisation du prix cible pour le CA projeté
    if (bien.prix && bien.prix.target) {
      chiffreAffaires += bien.prix.target * bien.quantite;
    }
  });

  this.investissementTotal = investissementTotal;
  this.chiffreAffairesProjete = chiffreAffaires;
  this.margeNette = chiffreAffaires - investissementTotal;
  this.roi = investissementTotal > 0 ? ((this.margeNette / investissementTotal) * 100) : 0;
};

// Export du modèle
module.exports = mongoose.model('Simulation', SimulationSchema);