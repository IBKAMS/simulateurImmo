const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Simulation = require('../models/Simulation');
const { protect, adminOnly } = require('../middleware/auth');

// Validation des données de simulation
const validateSimulation = [
  body('nomProjet')
    .notEmpty()
    .trim()
    .withMessage('Le nom du projet est requis'),
  body('localisation')
    .notEmpty()
    .trim()
    .withMessage('La localisation est requise'),
  body('surfaceTotaleTerrain')
    .isNumeric()
    .withMessage('La surface totale du terrain doit être un nombre'),
  body('coutFoncier')
    .isNumeric()
    .withMessage('Le coût foncier doit être un nombre'),
  body('typologieBiens')
    .isArray({ min: 1 })
    .withMessage('Au moins un type de bien est requis'),
  body('investissementTotal')
    .isNumeric()
    .withMessage('L\'investissement total doit être un nombre'),
  body('chiffreAffairesProjete')
    .isNumeric()
    .withMessage('Le chiffre d\'affaires projeté doit être un nombre'),
  body('margeNette')
    .isNumeric()
    .withMessage('La marge nette doit être un nombre'),
  body('roi')
    .isNumeric()
    .withMessage('Le ROI doit être un nombre')
];

// @route   GET /api/simulations
// @desc    Obtenir toutes les simulations de l'utilisateur connecté
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Récupérer les paramètres de pagination et de tri
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || '-createdAt';
    const status = req.query.status;

    // Construire le filtre
    const filter = { user: req.user._id };
    if (status) {
      filter.status = status;
    }

    // Compter le nombre total de documents
    const totalCount = await Simulation.countDocuments(filter);

    // Récupérer les simulations avec pagination
    const simulations = await Simulation.find(filter)
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-__v');

    res.json({
      success: true,
      count: simulations.length,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      simulations
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des simulations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des simulations'
    });
  }
});

// @route   GET /api/simulations/:id
// @desc    Obtenir une simulation par son ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const simulation = await Simulation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation non trouvée'
      });
    }

    res.json({
      success: true,
      simulation
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la simulation:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Simulation non trouvée'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la simulation'
    });
  }
});

// @route   POST /api/simulations
// @desc    Créer une nouvelle simulation
// @access  Private
router.post('/', protect, validateSimulation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Ajouter l'utilisateur à la simulation
    const simulationData = {
      ...req.body,
      user: req.user._id
    };

    // Créer la simulation
    const simulation = new Simulation(simulationData);

    // Calculer les financials si nécessaire
    if (simulation.typologieBiens && simulation.typologieBiens.length > 0) {
      simulation.calculateFinancials();
    }

    // Sauvegarder la simulation
    await simulation.save();

    res.status(201).json({
      success: true,
      simulation,
      message: 'Simulation créée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la création de la simulation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la simulation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/simulations/:id
// @desc    Mettre à jour une simulation
// @access  Private
router.put('/:id', protect, validateSimulation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Vérifier que la simulation appartient à l'utilisateur
    let simulation = await Simulation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation non trouvée'
      });
    }

    // Mettre à jour la simulation
    Object.assign(simulation, req.body);

    // Recalculer les financials si nécessaire
    if (simulation.typologieBiens && simulation.typologieBiens.length > 0) {
      simulation.calculateFinancials();
    }

    // Sauvegarder les modifications
    await simulation.save();

    res.json({
      success: true,
      simulation,
      message: 'Simulation mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la simulation:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Simulation non trouvée'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la simulation'
    });
  }
});

// @route   DELETE /api/simulations/:id
// @desc    Supprimer une simulation
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // Vérifier que la simulation appartient à l'utilisateur
    const simulation = await Simulation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation non trouvée'
      });
    }

    // Supprimer la simulation
    await simulation.deleteOne();

    res.json({
      success: true,
      message: 'Simulation supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la simulation:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Simulation non trouvée'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la simulation'
    });
  }
});

// @route   POST /api/simulations/:id/duplicate
// @desc    Dupliquer une simulation
// @access  Private
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    // Récupérer la simulation originale
    const originalSimulation = await Simulation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!originalSimulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation non trouvée'
      });
    }

    // Créer une copie de la simulation
    const simulationData = originalSimulation.toObject();
    delete simulationData._id;
    delete simulationData.createdAt;
    delete simulationData.updatedAt;

    // Modifier le nom pour indiquer que c'est une copie
    simulationData.nomProjet = `${simulationData.nomProjet} (Copie)`;
    simulationData.status = 'draft';
    simulationData.user = req.user._id;

    // Créer la nouvelle simulation
    const newSimulation = new Simulation(simulationData);
    await newSimulation.save();

    res.status(201).json({
      success: true,
      simulation: newSimulation,
      message: 'Simulation dupliquée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la duplication de la simulation:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Simulation non trouvée'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la duplication de la simulation'
    });
  }
});

// @route   PUT /api/simulations/:id/status
// @desc    Changer le statut d'une simulation
// @access  Private
router.put('/:id/status', protect, [
  body('status')
    .isIn(['draft', 'validated', 'archived'])
    .withMessage('Statut invalide')
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

    // Vérifier que la simulation appartient à l'utilisateur
    const simulation = await Simulation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation non trouvée'
      });
    }

    // Mettre à jour le statut
    simulation.status = req.body.status;
    await simulation.save();

    res.json({
      success: true,
      simulation,
      message: `Statut changé en ${req.body.status}`
    });

  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Simulation non trouvée'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut'
    });
  }
});

// @route   GET /api/simulations/stats/summary
// @desc    Obtenir les statistiques des simulations
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const stats = await Simulation.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalSimulations: { $sum: 1 },
          totalInvestissement: { $sum: '$investissementTotal' },
          totalChiffreAffaires: { $sum: '$chiffreAffairesProjete' },
          averageROI: { $avg: '$roi' },
          maxROI: { $max: '$roi' },
          minROI: { $min: '$roi' }
        }
      }
    ]);

    const statusCount = await Simulation.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalSimulations: 0,
        totalInvestissement: 0,
        totalChiffreAffaires: 0,
        averageROI: 0,
        maxROI: 0,
        minROI: 0
      },
      statusDistribution: statusCount
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// @route   GET /api/simulations/admin/all (Admin only)
// @desc    Obtenir toutes les simulations (admin)
// @access  Admin
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const simulations = await Simulation.find()
      .populate('user', 'email nom prenom entreprise')
      .sort('-createdAt');

    res.json({
      success: true,
      count: simulations.length,
      simulations
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des simulations (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des simulations'
    });
  }
});

module.exports = router;