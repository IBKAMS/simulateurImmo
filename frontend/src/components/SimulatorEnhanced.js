import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Chart from 'chart.js/auto';
import simulationService from '../services/simulationService';
import './SimulatorEnhanced.css';

const SimulatorEnhanced = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const simulationId = searchParams.get('id');

  // État de l'onglet actif
  const [activeTab, setActiveTab] = useState('config');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Références pour les graphiques
  const costChartRef = useRef(null);
  const benchmarkChartRef = useRef(null);
  const salesChartRef = useRef(null);
  const profitChartRef = useRef(null);
  const roiChartRef = useRef(null);
  const competitorChartRef = useRef(null);
  const marginChartRef = useRef(null);
  const phaseChartRef = useRef(null);
  const phasingApplicationChartRef = useRef(null);

  // Types de biens prédéfinis
  const predefinedPropertyTypes = [
    { nom: 'Studio', surfaceTerrain: 30, surfaceBati: 25, coutConstruction: 250000, quantite: 10 },
    { nom: 'Appartement 2P', surfaceTerrain: 50, surfaceBati: 45, coutConstruction: 280000, quantite: 15 },
    { nom: 'Appartement 3P', surfaceTerrain: 75, surfaceBati: 65, coutConstruction: 300000, quantite: 20 },
    { nom: 'Appartement 4P', surfaceTerrain: 100, surfaceBati: 85, coutConstruction: 320000, quantite: 15 },
    { nom: 'Villa Basse 3P', surfaceTerrain: 100, surfaceBati: 60, coutConstruction: 300000, quantite: 20 },
    { nom: 'Villa Basse 4P', surfaceTerrain: 150, surfaceBati: 80, coutConstruction: 300000, quantite: 30 },
    { nom: 'Villa Basse 5P', surfaceTerrain: 200, surfaceBati: 100, coutConstruction: 320000, quantite: 25 },
    { nom: 'Villa Duplex 3P', surfaceTerrain: 150, surfaceBati: 100, coutConstruction: 340000, quantite: 15 },
    { nom: 'Villa Duplex 4P', surfaceTerrain: 200, surfaceBati: 125, coutConstruction: 350000, quantite: 40 },
    { nom: 'Villa Duplex 5P', surfaceTerrain: 250, surfaceBati: 160, coutConstruction: 380000, quantite: 30 },
    { nom: 'Villa Duplex 6P', surfaceTerrain: 300, surfaceBati: 200, coutConstruction: 400000, quantite: 20 },
    { nom: 'Villa Triplex 5P', surfaceTerrain: 300, surfaceBati: 200, coutConstruction: 400000, quantite: 10 },
    { nom: 'Villa Triplex 6P', surfaceTerrain: 350, surfaceBati: 250, coutConstruction: 425000, quantite: 8 },
    { nom: 'Villa Triplex 8P', surfaceTerrain: 350, surfaceBati: 280, coutConstruction: 425000, quantite: 5 }
  ];

  // État principal de la simulation enrichi
  const [simulationData, setSimulationData] = useState({
    nomProjet: 'Cité Kongo',
    localisation: 'Port-Bouët, Abékan-Bernard',
    typeZone: 'strategic',
    localisationCoefficient: 1.5,
    surfaceTotaleTerrain: 10000,
    coutFoncier: 25000,
    typeTitreFoncier: 'acd',
    typologieBiens: [
      {
        id: 1,
        nom: 'Villa Basse 3P',
        surfaceTerrain: 100,
        surfaceBati: 60,
        coutConstruction: 300000,
        quantite: 20
      },
      {
        id: 2,
        nom: 'Villa Basse 4P',
        surfaceTerrain: 150,
        surfaceBati: 80,
        coutConstruction: 300000,
        quantite: 30
      },
      {
        id: 3,
        nom: 'Villa Duplex 4P',
        surfaceTerrain: 200,
        surfaceBati: 125,
        coutConstruction: 350000,
        quantite: 40
      },
      {
        id: 4,
        nom: 'Villa Duplex 5P',
        surfaceTerrain: 250,
        surfaceBati: 160,
        coutConstruction: 380000,
        quantite: 30
      },
      {
        id: 5,
        nom: 'Villa Triplex 8P',
        surfaceTerrain: 350,
        surfaceBati: 280,
        coutConstruction: 425000,
        quantite: 10
      }
    ],
    vrdCout: 10,
    fraisEtudes: 7,
    fraisFinanciers: 3,
    tauxTVA: 18,
    // Marges personnalisables
    customMargins: {
      level1: 30,
      level2: 60,
      level3: 80,
      level4: 100
    },
    marges: {
      penetration: 30,
      target: 60,
      premium: 80,
      premiumPlus: 100
    },
    phasage: {
      phase1Percent: 30,
      phase2Percent: 35,
      phase3Percent: 35,
      phase2Increase: 5,
      phase3Increase: 10
    },
    // Données des concurrents
    concurrents: [
      {
        nom: 'Kaydan Groupe',
        localisation: 'Ahoué PK24',
        typologie: 'Villas Basses 3-4P',
        prixMoyenM2: 463000,
        positionnement: 'economic',
        coefficient: 1.0
      },
      {
        nom: 'Italia Construction',
        localisation: 'Grand-Bassam',
        typologie: 'Villas Duplex 4-5P',
        prixMoyenM2: 461500,
        positionnement: 'standard',
        coefficient: 1.25
      },
      {
        nom: 'Ghandour Construction',
        localisation: 'Grand-Bassam',
        typologie: 'Villas Triplex 6-8P',
        prixMoyenM2: 700000,
        positionnement: 'premium',
        coefficient: 1.25
      }
    ]
  });

  // Résultats calculés enrichis
  const [financialResults, setFinancialResults] = useState({
    investissementTotal: 0,
    chiffreAffairesProjete: 0,
    margeNette: 0,
    roi: 0,
    detailsParType: [],
    comparaisonConcurrents: [],
    analyseRentabilite: []
  });

  // Charger une simulation existante si ID présent
  useEffect(() => {
    if (simulationId) {
      loadSimulation(simulationId);
    } else {
      calculateFinancials();
    }
  }, [simulationId]);

  // Recalculer les financials quand les données changent
  useEffect(() => {
    calculateFinancials();
  }, [simulationData]);

  // Initialiser les graphiques enrichis
  useEffect(() => {
    if (activeTab === 'simulation' || activeTab === 'analysis' || activeTab === 'benchmark' || activeTab === 'pricing') {
      updateChartsEnhanced();
    }
    return () => {
      // Nettoyer les graphiques
      if (costChartRef.current) costChartRef.current.destroy();
      if (benchmarkChartRef.current) benchmarkChartRef.current.destroy();
      if (salesChartRef.current) salesChartRef.current.destroy();
      if (profitChartRef.current) profitChartRef.current.destroy();
      if (roiChartRef.current) roiChartRef.current.destroy();
      if (competitorChartRef.current) competitorChartRef.current.destroy();
      if (marginChartRef.current) marginChartRef.current.destroy();
      if (phaseChartRef.current) phaseChartRef.current.destroy();
      if (phasingApplicationChartRef.current) phasingApplicationChartRef.current.destroy();
    };
  }, [activeTab, financialResults, simulationData.customMargins, simulationData.concurrents, simulationData.phasage]);

  const loadSimulation = async (id) => {
    try {
      setLoading(true);
      const response = await simulationService.getSimulation(id);
      if (response.success && response.simulation) {
        setSimulationData(response.simulation);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancials = () => {
    const {
      typologieBiens = [],
      coutFoncier = 0,
      vrdCout = 10,
      fraisEtudes = 7,
      fraisFinanciers = 3,
      tauxTVA = 18,
      customMargins,
      localisationCoefficient = 1.5,
      concurrents = []
    } = simulationData;

    let investissementTotal = 0;
    let detailsParType = [];
    let analyseRentabilite = [];

    typologieBiens.forEach(bien => {
      const coutTerrain = bien.surfaceTerrain * coutFoncier;
      const coutConstruction = bien.surfaceBati * bien.coutConstruction;
      const coutBase = coutTerrain + coutConstruction;
      const fraisAdditionnels = coutBase * ((vrdCout + fraisEtudes + fraisFinanciers) / 100);
      const coutTotalHT = coutBase + fraisAdditionnels;
      const coutTotalTTC = coutTotalHT * (1 + tauxTVA / 100);

      // Calcul des prix selon les marges personnalisées
      const prixParMarge = {};
      Object.entries(customMargins).forEach(([key, marge]) => {
        prixParMarge[key] = coutTotalHT * (1 + marge / 100) * (1 + tauxTVA / 100);
      });

      // Prix benchmark basé sur les concurrents
      const prixBenchmark = bien.surfaceBati *
        (concurrents.reduce((acc, c) => acc + c.prixMoyenM2, 0) / concurrents.length) *
        localisationCoefficient;

      detailsParType.push({
        nom: bien.nom,
        quantite: bien.quantite,
        coutUnitaire: coutTotalTTC,
        coutTotal: coutTotalTTC * bien.quantite,
        prixParMarge,
        prixBenchmark,
        surfaceBati: bien.surfaceBati,
        surfaceTerrain: bien.surfaceTerrain
      });

      investissementTotal += coutTotalTTC * bien.quantite;
    });

    // Calcul du CA et ROI pour chaque niveau de marge
    Object.entries(customMargins).forEach(([key, marge]) => {
      let ca = 0;
      detailsParType.forEach(detail => {
        ca += detail.prixParMarge[key] * detail.quantite;
      });
      const margeNette = ca - investissementTotal;
      const roi = investissementTotal > 0 ? (margeNette / investissementTotal) * 100 : 0;

      analyseRentabilite.push({
        niveau: key,
        marge: marge,
        chiffreAffaires: ca,
        margeNette: margeNette,
        roi: Math.round(roi * 100) / 100
      });
    });

    // Comparaison avec les concurrents
    const comparaisonConcurrents = concurrents.map(concurrent => {
      const prixMoyenKongo = detailsParType.reduce((acc, d) =>
        acc + d.prixParMarge.level2 / d.surfaceBati, 0) / detailsParType.length;

      return {
        nom: concurrent.nom,
        localisation: concurrent.localisation,
        prixM2Concurrent: concurrent.prixMoyenM2,
        prixM2Kongo: prixMoyenKongo,
        ecart: ((prixMoyenKongo - concurrent.prixMoyenM2) / concurrent.prixMoyenM2 * 100).toFixed(1)
      };
    });

    setFinancialResults({
      investissementTotal,
      chiffreAffairesProjete: analyseRentabilite[1]?.chiffreAffaires || 0,
      margeNette: analyseRentabilite[1]?.margeNette || 0,
      roi: analyseRentabilite[1]?.roi || 0,
      detailsParType,
      comparaisonConcurrents,
      analyseRentabilite
    });
  };

  const handleInputChange = (field, value) => {
    setSimulationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setSimulationData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handlePropertyTypeChange = (id, field, value) => {
    setSimulationData(prev => ({
      ...prev,
      typologieBiens: prev.typologieBiens.map(type =>
        type.id === id ? { ...type, [field]: value } : type
      )
    }));
  };

  const addPropertyType = (predefinedType = null) => {
    const newType = predefinedType ? {
      ...predefinedType,
      id: Date.now()
    } : {
      id: Date.now(),
      nom: `Nouveau Type ${simulationData.typologieBiens.length + 1}`,
      surfaceTerrain: 200,
      surfaceBati: 100,
      coutConstruction: 350000,
      quantite: 10
    };

    setSimulationData(prev => ({
      ...prev,
      typologieBiens: [...prev.typologieBiens, newType]
    }));
  };

  const removePropertyType = (id) => {
    if (simulationData.typologieBiens.length > 1) {
      setSimulationData(prev => ({
        ...prev,
        typologieBiens: prev.typologieBiens.filter(type => type.id !== id)
      }));
    }
  };

  const handleCompetitorChange = (index, field, value) => {
    setSimulationData(prev => ({
      ...prev,
      concurrents: prev.concurrents.map((concurrent, i) =>
        i === index ? { ...concurrent, [field]: value } : concurrent
      )
    }));
  };

  const addCompetitor = () => {
    const newCompetitor = {
      nom: `Nouveau Concurrent ${simulationData.concurrents.length + 1}`,
      localisation: 'Nouvelle Zone',
      typologie: 'Villas et Appartements',
      prixMoyenM2: 500000,
      positionnement: 'standard',
      coefficient: 1.0
    };

    setSimulationData(prev => ({
      ...prev,
      concurrents: [...prev.concurrents, newCompetitor]
    }));
  };

  const removeCompetitor = (index) => {
    if (simulationData.concurrents.length > 1) {
      setSimulationData(prev => ({
        ...prev,
        concurrents: prev.concurrents.filter((_, i) => i !== index)
      }));
    }
  };

  const saveSimulation = async () => {
    try {
      setLoading(true);
      setSaveMessage('');

      const dataToSave = simulationService.prepareSimulationData(simulationData);

      let response;
      if (simulationId) {
        response = await simulationService.updateSimulation(simulationId, dataToSave);
      } else {
        response = await simulationService.createSimulation(dataToSave);
      }

      if (response.success) {
        setSaveMessage('✅ Simulation sauvegardée avec succès !');
        if (!simulationId && response.simulation?._id) {
          navigate(`/simulator-enhanced?id=${response.simulation._id}`, { replace: true });
        }
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      setSaveMessage('❌ Erreur lors de la sauvegarde');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateChartsEnhanced = () => {
    // Détruire les graphiques existants (Chart.js stocke la référence du graphique)
    if (costChartRef.current) costChartRef.current.destroy();
    if (salesChartRef.current) salesChartRef.current.destroy();
    if (profitChartRef.current) profitChartRef.current.destroy();
    if (roiChartRef.current) roiChartRef.current.destroy();
    if (competitorChartRef.current) competitorChartRef.current.destroy();
    if (marginChartRef.current) marginChartRef.current.destroy();
    if (phaseChartRef.current) phaseChartRef.current.destroy();
    if (phasingApplicationChartRef.current) phasingApplicationChartRef.current.destroy();

    // Graphique des coûts par type
    const costCanvas = document.getElementById('costChart');
    if (costCanvas && financialResults.detailsParType.length > 0) {
      costChartRef.current = new Chart(costCanvas, {
        type: 'bar',
        data: {
          labels: financialResults.detailsParType.map(t => t.nom),
          datasets: [
            {
              label: 'Coût Foncier (M FCFA)',
              data: financialResults.detailsParType.map(t =>
                (t.surfaceTerrain * simulationData.coutFoncier * t.quantite) / 1000000
              ),
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 2
            },
            {
              label: 'Coût Construction (M FCFA)',
              data: financialResults.detailsParType.map(t => {
                const typeBien = simulationData.typologieBiens.find(tb => tb.nom === t.nom);
                return typeBien ? (t.surfaceBati * typeBien.coutConstruction * t.quantite) / 1000000 : 0;
              }),
              backgroundColor: 'rgba(34, 197, 94, 0.7)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true },
            y: { stacked: true }
          }
        }
      });
    }

    // Graphique de comparaison des marges
    const marginCanvas = document.getElementById('marginChart');
    if (marginCanvas && financialResults.analyseRentabilite.length > 0) {
      marginChartRef.current = new Chart(marginCanvas, {
        type: 'line',
        data: {
          labels: financialResults.analyseRentabilite.map(a => `Marge ${a.marge}%`),
          datasets: [
            {
              label: 'Chiffre d\'Affaires (M FCFA)',
              data: financialResults.analyseRentabilite.map(a => a.chiffreAffaires / 1000000),
              borderColor: 'rgba(168, 85, 247, 1)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              yAxisID: 'y',
              tension: 0.4
            },
            {
              label: 'ROI (%)',
              data: financialResults.analyseRentabilite.map(a => a.roi),
              borderColor: 'rgba(251, 146, 60, 1)',
              backgroundColor: 'rgba(251, 146, 60, 0.1)',
              yAxisID: 'y1',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'CA (M FCFA)'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'ROI (%)'
              },
              grid: {
                drawOnChartArea: false,
              }
            }
          }
        }
      });
    }

    // Graphique de comparaison concurrentielle
    const competitorCanvas = document.getElementById('competitorChart');
    if (competitorCanvas && financialResults.comparaisonConcurrents.length > 0) {
      const konkoPrix = financialResults.detailsParType.length > 0 ?
        financialResults.detailsParType.reduce((acc, d) =>
          acc + (d.prixParMarge.level2 / d.surfaceBati), 0) / financialResults.detailsParType.length : 0;

      competitorChartRef.current = new Chart(competitorCanvas, {
        type: 'bar',
        data: {
          labels: [...simulationData.concurrents.map(c => c.nom), 'Cité Kongo'],
          datasets: [{
            label: 'Prix au m² (FCFA)',
            data: [...simulationData.concurrents.map(c => c.prixMoyenM2), konkoPrix],
            backgroundColor: [
              'rgba(239, 68, 68, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(168, 85, 247, 0.7)',
              'rgba(34, 197, 94, 0.7)'
            ],
            borderColor: [
              'rgba(239, 68, 68, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(168, 85, 247, 1)',
              'rgba(34, 197, 94, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }

    // Graphique du phasage des ventes
    const phaseCanvas = document.getElementById('phaseChart');
    if (phaseCanvas) {
      // Utilisation des pourcentages manuels définis par l'utilisateur
      const phase1Percent = simulationData.phasage.phase1Percent;
      const phase2Percent = simulationData.phasage.phase2Percent;
      const phase3Percent = simulationData.phasage.phase3Percent;

      // Calcul du CA par phase avec les pourcentages manuels et augmentations
      const baseCA = financialResults.chiffreAffairesProjete;
      const phase1CA = baseCA * phase1Percent / 100;
      const phase2CA = baseCA * phase2Percent / 100 * (1 + simulationData.phasage.phase2Increase / 100);
      const phase3CA = baseCA * phase3Percent / 100 * (1 + simulationData.phasage.phase3Increase / 100);

      phaseChartRef.current = new Chart(phaseCanvas, {
        type: 'doughnut',
        data: {
          labels: [
            `Phase 1 (${phase1Percent}%)`,
            `Phase 2 (${phase2Percent}%)`,
            `Phase 3 (${phase3Percent}%)`
          ],
          datasets: [{
            data: [phase1CA / 1000000, phase2CA / 1000000, phase3CA / 1000000],
            backgroundColor: [
              'rgba(251, 191, 36, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(59, 130, 246, 0.8)'
            ],
            borderColor: [
              'rgba(251, 191, 36, 1)',
              'rgba(34, 197, 94, 1)',
              'rgba(59, 130, 246, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value.toFixed(1)} M FCFA (${percentage}% du CA total)`;
                }
              }
            }
          }
        }
      });
    }

    // Graphique d'évolution des ventes par phase
    const salesCanvas = document.getElementById('salesChart');
    if (salesCanvas) {
      // Utilisation des pourcentages manuels pour les unités par phase
      const totalUnits = simulationData.typologieBiens.reduce((sum, type) => sum + type.quantite, 0);
      const phase1Percent = simulationData.phasage.phase1Percent;
      const phase2Percent = simulationData.phasage.phase2Percent;
      const phase3Percent = simulationData.phasage.phase3Percent;

      const phase1Units = Math.round(totalUnits * phase1Percent / 100);
      const phase2Units = Math.round(totalUnits * phase2Percent / 100);
      const phase3Units = totalUnits - phase1Units - phase2Units; // Pour éviter les erreurs d'arrondi

      // Prix moyen par unité (basé sur marge level2)
      const avgPricePerUnit = financialResults.detailsParType.length > 0 ?
        financialResults.detailsParType.reduce((sum, detail) =>
          sum + (detail.prixParMarge.level2 * detail.quantite), 0) / totalUnits : 0;

      // Calcul des CA par phase avec augmentations
      const phase1Revenue = phase1Units * avgPricePerUnit;
      const phase2Revenue = phase2Units * avgPricePerUnit * (1 + simulationData.phasage.phase2Increase / 100);
      const phase3Revenue = phase3Units * avgPricePerUnit * (1 + simulationData.phasage.phase3Increase / 100);

      salesChartRef.current = new Chart(salesCanvas, {
        type: 'bar',
        data: {
          labels: [
            `Phase 1 - Lancement (${phase1Percent}%)`,
            `Phase 2 - Croissance (${phase2Percent}%)`,
            `Phase 3 - Maturité (${phase3Percent}%)`
          ],
          datasets: [
            {
              label: 'Unités Vendues',
              data: [phase1Units, phase2Units, phase3Units],
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 2,
              yAxisID: 'y'
            },
            {
              label: 'Chiffre d\'Affaires (M FCFA)',
              data: [phase1Revenue / 1000000, phase2Revenue / 1000000, phase3Revenue / 1000000],
              backgroundColor: 'rgba(34, 197, 94, 0.6)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 2,
              yAxisID: 'y1',
              type: 'line'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Nombre d\'Unités'
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'CA (M FCFA)'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: `Répartition: ${phase1Percent}% / ${phase2Percent}% / ${phase3Percent}% | Augmentations de prix: Phase 2 (+${simulationData.phasage.phase2Increase}%), Phase 3 (+${simulationData.phasage.phase3Increase}%)`,
              font: {
                size: 12
              },
              padding: {
                top: 10,
                bottom: 10
              }
            },
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.dataset.yAxisID === 'y') {
                    label += context.parsed.y + ' unités';
                  } else {
                    label += context.parsed.y.toFixed(1) + ' M FCFA';
                  }
                  return label;
                }
              }
            }
          }
        }
      });
    }

    // Graphique d'application de la stratégie de phasage
    const phasingApplicationCanvas = document.getElementById('phasingApplicationChart');
    if (phasingApplicationCanvas && activeTab === 'pricing') {
      // Calculer les données pour chaque phase
      let phase1Revenue = 0;
      let phase2Revenue = 0;
      let phase3Revenue = 0;
      let phase1Cost = 0;
      let phase2Cost = 0;
      let phase3Cost = 0;

      const totalUnits = simulationData.typologieBiens.reduce((sum, type) => sum + type.quantite, 0);
      const costPerUnit = financialResults.investissementTotal / totalUnits;

      simulationData.typologieBiens.forEach(type => {
        const detail = financialResults.detailsParType.find(d => d.nom === type.nom);
        if (detail) {
          const basePrice = detail.prixParMarge.level2 || 0;
          const p1Units = Math.round(type.quantite * simulationData.phasage.phase1Percent / 100);
          const p2Units = Math.round(type.quantite * simulationData.phasage.phase2Percent / 100);
          const p3Units = type.quantite - p1Units - p2Units;

          phase1Revenue += p1Units * basePrice;
          phase2Revenue += p2Units * basePrice * (1 + simulationData.phasage.phase2Increase / 100);
          phase3Revenue += p3Units * basePrice * (1 + simulationData.phasage.phase3Increase / 100);

          phase1Cost += p1Units * costPerUnit;
          phase2Cost += p2Units * costPerUnit;
          phase3Cost += p3Units * costPerUnit;
        }
      });

      // Revenus et marges cumulés
      const cumulativeRevenue = [
        phase1Revenue / 1000000,
        (phase1Revenue + phase2Revenue) / 1000000,
        (phase1Revenue + phase2Revenue + phase3Revenue) / 1000000
      ];

      const cumulativeCost = [
        phase1Cost / 1000000,
        (phase1Cost + phase2Cost) / 1000000,
        (phase1Cost + phase2Cost + phase3Cost) / 1000000
      ];

      const cumulativeMargin = cumulativeRevenue.map((rev, idx) => rev - cumulativeCost[idx]);

      phasingApplicationChartRef.current = new Chart(phasingApplicationCanvas, {
        type: 'bar',
        data: {
          labels: ['Phase 1', 'Phase 1+2', 'Phase 1+2+3'],
          datasets: [
            {
              label: 'Coûts Cumulés (M FCFA)',
              data: cumulativeCost,
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              borderColor: 'rgba(239, 68, 68, 1)',
              borderWidth: 2,
              stack: 'stack1'
            },
            {
              label: 'Marges Cumulées (M FCFA)',
              data: cumulativeMargin,
              backgroundColor: 'rgba(34, 197, 94, 0.7)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 2,
              stack: 'stack1'
            },
            {
              label: 'CA Cumulé (M FCFA)',
              data: cumulativeRevenue,
              type: 'line',
              borderColor: 'rgba(59, 130, 246, 1)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 3,
              fill: false,
              tension: 0.4,
              yAxisID: 'y'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false
              }
            },
            y: {
              stacked: true,
              position: 'left',
              title: {
                display: true,
                text: 'Montants (M FCFA)'
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Évolution Cumulative : Coûts, Marges et Chiffre d\'Affaires',
              font: {
                size: 14,
                weight: 'bold'
              },
              padding: {
                top: 10,
                bottom: 20
              }
            },
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                padding: 15,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += context.parsed.y.toFixed(1) + ' M FCFA';
                  return label;
                },
                footer: function(tooltipItems) {
                  const index = tooltipItems[0].dataIndex;
                  const revenue = cumulativeRevenue[index];
                  const cost = cumulativeCost[index];
                  const roi = ((revenue - cost) / cost * 100).toFixed(1);
                  return `ROI Cumulé: ${roi}%`;
                }
              }
            }
          }
        }
      });
    }
  };

  const formatNumber = (num) => {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const formatCurrency = (value) => {
    return formatNumber(value) + ' FCFA';
  };

  // Fonction pour générer des recommandations stratégiques dynamiques
  const generateStrategicRecommendations = () => {
    const recommendations = [];

    // 1. Valorisation de la Localisation
    const localizationRec = {
      title: '📍 Valorisation de la Localisation',
      content: ''
    };

    if (simulationData.typeZone === 'strategic') {
      localizationRec.content = `Zone stratégique ${simulationData.localisation} : Mettez en avant les infrastructures majeures et la connectivité. Le coefficient ${simulationData.localisationCoefficient}x justifie un premium de prix.`;
    } else if (simulationData.typeZone === 'premium') {
      localizationRec.content = `Zone premium ${simulationData.localisation} : Valorisez l'attractivité et le standing du quartier. Position privilégiée pour une clientèle exigeante.`;
    } else if (simulationData.typeZone === 'standard') {
      localizationRec.content = `Zone urbaine établie ${simulationData.localisation} : Communiquez sur l'accessibilité, les commodités de proximité et le rapport qualité-prix optimal.`;
    } else {
      localizationRec.content = `Zone en développement ${simulationData.localisation} : Positionnez le projet comme opportunité d'investissement avec fort potentiel de plus-value.`;
    }

    // Ajouter des éléments spécifiques selon le coefficient
    if (simulationData.localisationCoefficient >= 1.5) {
      localizationRec.content += ' La valorisation exceptionnelle (coef. ' + simulationData.localisationCoefficient + 'x) permet de justifier des prix premium de 30-50% vs marché.';
    } else if (simulationData.localisationCoefficient >= 1.2) {
      localizationRec.content += ' L\'attractivité supérieure permet un positionnement prix 15-25% au-dessus de la moyenne.';
    }

    recommendations.push(localizationRec);

    // 2. Optimisation des Marges
    const marginRec = {
      title: '💰 Optimisation des Marges',
      content: ''
    };

    // Analyser quelle typologie a la meilleure marge potentielle
    const dominantType = simulationData.typologieBiens.sort((a, b) => b.quantite - a.quantite)[0];
    const avgROI = financialResults.roi;

    if (avgROI > 80) {
      marginRec.content = `ROI exceptionnel de ${Math.round(avgROI)}%. Maximisez les marges sur ${dominantType?.nom || 'les produits phares'} (${simulationData.customMargins.level3}-${simulationData.customMargins.level4}%) tout en maintenant la compétitivité.`;
    } else if (avgROI > 50) {
      marginRec.content = `ROI solide de ${Math.round(avgROI)}%. Focus sur ${dominantType?.nom || 'le cœur de gamme'} avec marge optimale ${simulationData.customMargins.level2}-${simulationData.customMargins.level3}%. Utilisez les produits d'entrée pour l'acquisition client.`;
    } else {
      marginRec.content = `ROI à optimiser (${Math.round(avgROI)}%). Révisez la structure de coûts ou augmentez les marges sur les produits premium. Focus volume sur ${dominantType?.nom || 'les best-sellers'}.`;
    }

    recommendations.push(marginRec);

    // 3. Stratégie de Phasage
    const phasingRec = {
      title: '📈 Stratégie de Phasage',
      content: ''
    };

    const phase1Percent = simulationData.phasage.phase1Percent;
    const phase2Percent = simulationData.phasage.phase2Percent;
    const phase3Percent = simulationData.phasage.phase3Percent;
    const phase2Increase = simulationData.phasage.phase2Increase;
    const phase3Increase = simulationData.phasage.phase3Increase;

    if (phase1Percent <= 30) {
      phasingRec.content = `Lancement prudent avec ${phase1Percent}% des unités en phase 1. `;
    } else {
      phasingRec.content = `Lancement ambitieux avec ${phase1Percent}% des unités en phase 1. `;
    }

    phasingRec.content += `Phase 2 avec ${phase2Percent}% des unités et phase 3 avec ${phase3Percent}% des unités. `;
    phasingRec.content += `Augmentations progressives des prix: +${phase2Increase}% en phase 2 et +${phase3Increase}% en phase 3 pour capturer la plus-value.`;

    // Adapter selon la comparaison concurrentielle
    const avgCompetitorPrice = simulationData.concurrents.reduce((acc, c) => acc + c.prixMoyenM2, 0) / simulationData.concurrents.length || 0;
    const projectPrice = financialResults.detailsParType.length > 0 ?
      financialResults.detailsParType.reduce((acc, d) =>
        acc + (d.prixParMarge.level2 / d.surfaceBati), 0) / financialResults.detailsParType.length : 0;

    if (projectPrice < avgCompetitorPrice * 0.9) {
      phasingRec.content += ' Prix agressif vs concurrence : accélérez les ventes en phase 1.';
    } else if (projectPrice > avgCompetitorPrice * 1.1) {
      phasingRec.content += ' Positionnement premium : étalez les ventes pour maintenir les prix élevés.';
    }

    recommendations.push(phasingRec);

    // 4. Sécurité Juridique
    const legalRec = {
      title: '🛡️ Sécurité Juridique',
      content: ''
    };

    if (simulationData.typeTitreFoncier === 'acd') {
      legalRec.content = 'L\'ACD offre une sécurité foncière maximale. Argument de vente majeur pour rassurer les acquéreurs et justifier un premium prix. Communiquez sur la garantie absolue de propriété.';
    } else if (simulationData.typeTitreFoncier === 'title') {
      legalRec.content = 'Le Titre Foncier garantit la pleine propriété. Valorisez cet avantage concurrentiel crucial pour les investisseurs institutionnels et particuliers exigeants.';
    } else if (simulationData.typeTitreFoncier === 'permit') {
      legalRec.content = 'Permis d\'occuper : Prévoyez la conversion vers un titre définitif. Rassurez sur le processus de régularisation et proposez un accompagnement juridique.';
    } else {
      legalRec.content = 'Bail emphytéotique : Mettez en avant la durée du bail et les garanties de renouvellement. Adaptez le pricing à ce statut particulier.';
    }

    recommendations.push(legalRec);

    return recommendations;
  };

  // Fonction pour analyser le positionnement concurrentiel
  const analyzeCompetitivePosition = () => {
    const avgCompetitorPrice = simulationData.concurrents.reduce((acc, c) => acc + c.prixMoyenM2, 0) / simulationData.concurrents.length || 0;
    const kongoPrice = financialResults.detailsParType.length > 0 ?
      financialResults.detailsParType.reduce((acc, d) =>
        acc + (d.prixParMarge.level2 / d.surfaceBati), 0) / financialResults.detailsParType.length : 0;

    const priceAdvantage = kongoPrice < avgCompetitorPrice * 0.9;
    const premiumPositioning = kongoPrice > avgCompetitorPrice * 1.1;

    // Analyser les typologies
    const competitorTypologies = simulationData.concurrents.map(c => c.typologie || '').filter(t => t);
    const hasUniqueTypology = !competitorTypologies.some(t =>
      simulationData.typologieBiens.some(tb => tb.nom.toLowerCase().includes(t.toLowerCase()))
    );

    // Analyser les positionnements
    const premiumCompetitors = simulationData.concurrents.filter(c => c.positionnement === 'premium').length;
    const economicCompetitors = simulationData.concurrents.filter(c => c.positionnement === 'economic').length;

    const advantages = [];
    const recommendations = [];

    // Générer les avantages
    if (simulationData.typeZone === 'strategic') {
      advantages.push('✅ Zone stratégique avec infrastructures majeures');
    }

    if (simulationData.typeTitreFoncier === 'acd' || simulationData.typeTitreFoncier === 'title') {
      advantages.push('✅ Sécurité juridique maximale (' +
        (simulationData.typeTitreFoncier === 'acd' ? 'ACD' : 'Titre Foncier') + ')');
    }

    if (priceAdvantage) {
      advantages.push(`✅ Prix compétitif (-${Math.round(((avgCompetitorPrice - kongoPrice) / avgCompetitorPrice) * 100)}% vs marché)`);
    }

    if (simulationData.localisationCoefficient > 1.2) {
      advantages.push('✅ Coefficient de localisation élevé (' + simulationData.localisationCoefficient + 'x)');
    }

    if (hasUniqueTypology) {
      advantages.push('✅ Typologie de biens différenciée');
    }

    // Ajouter des avantages par défaut si peu d'avantages
    if (advantages.length < 3) {
      advantages.push('✅ Diversité de l\'offre immobilière');
      advantages.push('✅ Potentiel de plus-value à long terme');
    }

    // Générer les recommandations
    if (premiumCompetitors > economicCompetitors) {
      recommendations.push('• Positionner les produits d\'appel pour capturer le marché économique');
    } else {
      recommendations.push('• Développer une offre premium pour se différencier');
    }

    if (!priceAdvantage && !premiumPositioning) {
      recommendations.push('• Optimiser les marges sur les produits phares (60-80%)');
    } else if (priceAdvantage) {
      recommendations.push('• Capitaliser sur l\'avantage prix en phase de lancement');
    } else {
      recommendations.push('• Justifier le premium par des prestations haut de gamme');
    }

    // Recommandations basées sur les typologies
    const dominantTypology = simulationData.typologieBiens.sort((a, b) => b.quantite - a.quantite)[0];
    if (dominantTypology) {
      recommendations.push(`• Focus sur ${dominantTypology.nom} (${dominantTypology.quantite} unités)`);
    }

    recommendations.push('• Stratégie de phasage progressive pour maximiser la valeur');

    // Points faibles potentiels
    const weaknesses = [];
    if (kongoPrice > avgCompetitorPrice * 1.3) {
      weaknesses.push('⚠️ Prix supérieur de ' + Math.round(((kongoPrice - avgCompetitorPrice) / avgCompetitorPrice) * 100) + '% au marché');
    }

    if (simulationData.localisationCoefficient < 1) {
      weaknesses.push('⚠️ Zone moins attractive (coefficient ' + simulationData.localisationCoefficient + ')');
    }

    if (simulationData.concurrents.filter(c => c.coefficient > simulationData.localisationCoefficient).length > 0) {
      weaknesses.push('⚠️ Concurrents avec meilleur coefficient de localisation');
    }

    return { advantages, recommendations, weaknesses };
  };

  // Tooltip component
  const Tooltip = ({ text, children }) => (
    <div className="tooltip-wrapper">
      {children}
      <span className="tooltip-icon">?</span>
      <div className="tooltip-content">{text}</div>
    </div>
  );

  return (
    <div className="simulator-container enhanced">
      <div className="simulator-header gradient-header">
        <div className="header-left">
          <h1>🏗️ Simulateur de Tarification Immobilière Pro</h1>
          <p>ALIZ STRATEGY - {user?.email}</p>
        </div>
        <div className="header-actions">
          <button onClick={saveSimulation} className="btn btn-primary" disabled={loading}>
            💾 {simulationId ? 'Mettre à jour' : 'Sauvegarder'}
          </button>
          <Link to="/dashboard" className="btn btn-secondary">
            📊 Tableau de bord
          </Link>
          <button onClick={onLogout} className="btn btn-outline">
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className={`alert ${saveMessage.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {saveMessage}
        </div>
      )}

      <div className="simulator-body">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            ⚙️ Configuration
          </button>
          <button
            className={`tab ${activeTab === 'costs' ? 'active' : ''}`}
            onClick={() => setActiveTab('costs')}
          >
            💰 Coûts
          </button>
          <button
            className={`tab ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            🏷️ Stratégie de Prix
          </button>
          <button
            className={`tab ${activeTab === 'benchmark' ? 'active' : ''}`}
            onClick={() => setActiveTab('benchmark')}
          >
            📊 Benchmarking
          </button>
          <button
            className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            📈 Analyse
          </button>
          <button
            className={`tab ${activeTab === 'simulation' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulation')}
          >
            🎯 Résultats
          </button>
        </div>

        {/* Configuration Tab Enhanced */}
        <div className={`tab-content ${activeTab === 'config' ? 'active' : ''}`}>
          <div className="section-header">
            <h2>Configuration du Projet</h2>
            <div className="help-box">
              💡 <strong>Guide:</strong> Configurez les paramètres de base de votre projet immobilier.
              La localisation stratégique et le type de titre foncier influencent significativement la valorisation.
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card gradient-card">
              <div className="card-header">
                <h3 className="card-title">📍 Informations Générales</h3>
              </div>

              <div className="form-group">
                <label>
                  Nom du Projet
                  <Tooltip text="Nom commercial du projet immobilier" />
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={simulationData.nomProjet}
                  onChange={(e) => handleInputChange('nomProjet', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>
                  Localisation
                  <Tooltip text="Emplacement précis du projet (commune, quartier)" />
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={simulationData.localisation}
                  onChange={(e) => handleInputChange('localisation', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>
                  Type de Zone
                  <Tooltip text="Le type de zone détermine le coefficient de valorisation du projet selon son attractivité et ses infrastructures" />
                </label>
                <select
                  className="form-control"
                  value={simulationData.typeZone}
                  onChange={(e) => {
                    handleInputChange('typeZone', e.target.value);
                    const coeffs = {
                      'strategic': 1.5,
                      'premium': 1.25,
                      'standard': 1.0,
                      'economic': 0.8
                    };
                    handleInputChange('localisationCoefficient', coeffs[e.target.value]);
                  }}
                >
                  <option value="strategic">🌟 Zone Stratégique (Infrastructures majeures) - Coef. 1.5x</option>
                  <option value="premium">💎 Zone Premium (Haute attractivité) - Coef. 1.25x</option>
                  <option value="standard">🏢 Zone Standard (Urbaine établie) - Coef. 1.0x</option>
                  <option value="economic">🏘️ Zone Économique (Développement) - Coef. 0.8x</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Type de Titre Foncier
                  <Tooltip text="Le type de titre détermine le niveau de sécurité juridique et la valeur du bien. L'ACD et le Titre Foncier offrent la meilleure garantie" />
                </label>
                <select
                  className="form-control"
                  value={simulationData.typeTitreFoncier}
                  onChange={(e) => handleInputChange('typeTitreFoncier', e.target.value)}
                >
                  <option value="acd">✅ ACD - Arrêté de Concession Définitive (Sécurisé)</option>
                  <option value="title">📜 Titre Foncier (Propriété pleine)</option>
                  <option value="permit">📋 Permis d'Occuper (Temporaire)</option>
                  <option value="lease">📄 Bail Emphytéotique (Long terme)</option>
                </select>
              </div>

              <div className="form-group coefficient-group">
                <label>
                  Coefficient de Localisation
                  <Tooltip text="Multiplicateur de valeur basé sur l'attractivité et les infrastructures de la zone. Ajuste automatiquement selon le type de zone sélectionné" />
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider gradient-slider"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={simulationData.localisationCoefficient}
                    onChange={(e) => handleInputChange('localisationCoefficient', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">{simulationData.localisationCoefficient}x</div>
                </div>
              </div>
            </div>

            <div className="card gradient-card">
              <div className="card-header">
                <h3 className="card-title">🏠 Typologie des Biens</h3>
                <Tooltip text="Définissez les différents types de biens immobiliers du projet avec leurs surfaces et quantités respectives" />
              </div>

              <div className="property-types-container">
                {simulationData.typologieBiens.map((type) => (
                  <div key={type.id} className="property-type-item enhanced">
                    <div className="type-header">
                      <input
                        type="text"
                        className="form-control type-name"
                        value={type.nom}
                        onChange={(e) => handlePropertyTypeChange(type.id, 'nom', e.target.value)}
                        placeholder="Nom du type de bien"
                      />
                      {simulationData.typologieBiens.length > 1 && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => removePropertyType(type.id)}
                          title="Supprimer ce type"
                        >
                          ✖
                        </button>
                      )}
                    </div>
                    <div className="property-type-grid">
                      <div className="input-group-enhanced">
                        <label>Terrain (m²)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={type.surfaceTerrain}
                          onChange={(e) => handlePropertyTypeChange(type.id, 'surfaceTerrain', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="input-group-enhanced">
                        <label>Bâti (m²)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={type.surfaceBati}
                          onChange={(e) => handlePropertyTypeChange(type.id, 'surfaceBati', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="input-group-enhanced">
                        <label>Coût/m² (FCFA)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={type.coutConstruction}
                          onChange={(e) => handlePropertyTypeChange(type.id, 'coutConstruction', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="input-group-enhanced">
                        <label>Quantité</label>
                        <input
                          type="number"
                          className="form-control"
                          value={type.quantite}
                          onChange={(e) => handlePropertyTypeChange(type.id, 'quantite', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {simulationData.typologieBiens.length < 15 && (
                <div className="add-property-section">
                  <select
                    className="form-control select-predefined"
                    onChange={(e) => {
                      if (e.target.value) {
                        const selected = predefinedPropertyTypes.find(p => p.nom === e.target.value);
                        if (selected) {
                          addPropertyType(selected);
                          e.target.value = '';
                        }
                      }
                    }}
                  >
                    <option value="">-- Sélectionner un type prédéfini --</option>
                    {predefinedPropertyTypes.map((type, index) => (
                      <option key={index} value={type.nom}>{type.nom}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary btn-block mt-2" onClick={() => addPropertyType()}>
                    + Ajouter un Type Personnalisé
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card gradient-card mt-3">
            <div className="card-header">
              <h3 className="card-title">📏 Paramètres Fonciers</h3>
            </div>
            <div className="grid grid-3">
              <div className="form-group">
                <label>
                  Surface Totale du Terrain
                  <Tooltip text="Surface totale disponible pour le développement du projet immobilier" />
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={simulationData.surfaceTotaleTerrain}
                    onChange={(e) => handleInputChange('surfaceTotaleTerrain', parseFloat(e.target.value) || 0)}
                  />
                  <span className="input-suffix">m²</span>
                </div>
              </div>
              <div className="form-group">
                <label>
                  Coût du Foncier
                  <Tooltip text="Prix d'acquisition du terrain par m². Varie selon la zone : périphérie (15-30k), urbaine (30-50k), premium (50-100k+)" />
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={simulationData.coutFoncier}
                    onChange={(e) => handleInputChange('coutFoncier', parseFloat(e.target.value) || 0)}
                  />
                  <span className="input-suffix">FCFA/m²</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Costs Tab Enhanced */}
        <div className={`tab-content ${activeTab === 'costs' ? 'active' : ''}`}>
          <div className="section-header">
            <h2>Analyse des Coûts</h2>
            <div className="help-box info-box">
              💡 <strong>Comprendre les Coûts de Construction:</strong>
              <ul>
                <li>• Économique : 200 000 - 300 000 FCFA/m² (finitions basiques)</li>
                <li>• Standard : 300 000 - 400 000 FCFA/m² (finitions moyennes)</li>
                <li>• Premium : 400 000 - 500 000 FCFA/m² (finitions haut de gamme)</li>
                <li>• Luxe : 500 000+ FCFA/m² (finitions exceptionnelles)</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card gradient-card">
              <div className="card-header">
                <h3 className="card-title">💵 Frais Additionnels</h3>
              </div>

              <div style={{ padding: '20px' }}>
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label>
                    VRD et Aménagements
                    <Tooltip text="Voirie et Réseaux Divers : routes internes, réseaux d'eau, électricité, assainissement. Généralement entre 10-20% du coût de base" />
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      className="slider gradient-slider"
                      min="5"
                      max="25"
                      value={simulationData.vrdCout}
                      onChange={(e) => handleInputChange('vrdCout', parseFloat(e.target.value))}
                    />
                    <div className="slider-value">{simulationData.vrdCout}%</div>
                  </div>
                </div>

              <div className="form-group">
                <label>
                  Frais d'Études et Maîtrise d'Œuvre
                  <Tooltip text="Honoraires architectes, ingénieurs, bureaux d'études techniques et géomètres. Représente généralement 5-10% du coût total" />
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider gradient-slider"
                    min="3"
                    max="15"
                    value={simulationData.fraisEtudes}
                    onChange={(e) => handleInputChange('fraisEtudes', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">{simulationData.fraisEtudes}%</div>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Frais Financiers
                  <Tooltip text="Intérêts bancaires, frais de dossier, garanties et assurances. Variable selon le montage financier (0-8% typiquement)" />
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider gradient-slider"
                    min="0"
                    max="10"
                    value={simulationData.fraisFinanciers}
                    onChange={(e) => handleInputChange('fraisFinanciers', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">{simulationData.fraisFinanciers}%</div>
                </div>
              </div>

              <div className="form-group">
                <label>
                  TVA
                  <Tooltip text="Taxe sur la Valeur Ajoutée applicable. Standard : 18% | Social agréé : 9% | Projets exonérés : 0%" />
                </label>
                <select
                  className="form-control"
                  value={simulationData.tauxTVA}
                  onChange={(e) => handleInputChange('tauxTVA', parseFloat(e.target.value))}
                >
                  <option value="18">💼 18% - Standard</option>
                  <option value="9">🏘️ 9% - Logement Social</option>
                  <option value="0">🎁 0% - Exonéré</option>
                </select>
              </div>
              </div>
            </div>

            <div className="card gradient-card">
              <div className="card-header">
                <h3 className="card-title">📊 Récapitulatif des Coûts</h3>
              </div>
              <div className="costs-table">
                <table className="table-enhanced">
                  <thead>
                    <tr>
                      <th>Type de Bien</th>
                      <th>Coût Foncier</th>
                      <th>Coût Construction</th>
                      <th>Frais Add.</th>
                      <th className="highlight-blue">Coût Total HT</th>
                      <th className="highlight-green">Coût Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialResults.detailsParType.map((detail, index) => {
                      const coutFoncier = detail.surfaceTerrain * simulationData.coutFoncier;
                      const coutConstruction = detail.surfaceBati *
                        simulationData.typologieBiens.find(t => t.nom === detail.nom)?.coutConstruction || 0;
                      const fraisAdd = (coutFoncier + coutConstruction) *
                        ((simulationData.vrdCout + simulationData.fraisEtudes + simulationData.fraisFinanciers) / 100);
                      const coutHT = coutFoncier + coutConstruction + fraisAdd;
                      const coutTTC = coutHT * (1 + simulationData.tauxTVA / 100);

                      return (
                        <tr key={index}>
                          <td>{detail.nom}</td>
                          <td>{formatCurrency(coutFoncier)}</td>
                          <td>{formatCurrency(coutConstruction)}</td>
                          <td>{formatCurrency(fraisAdd)}</td>
                          <td className="highlight-blue">{formatCurrency(coutHT)}</td>
                          <td className="highlight-green">{formatCurrency(coutTTC)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan="4"><strong>TOTAL</strong></td>
                      <td className="highlight-blue">
                        <strong>
                          {formatCurrency(
                            financialResults.investissementTotal / (1 + simulationData.tauxTVA / 100)
                          )}
                        </strong>
                      </td>
                      <td className="highlight-green">
                        <strong>{formatCurrency(financialResults.investissementTotal)}</strong>
                      </td>
                    </tr>
                    <tr className="total-row" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
                      <td colSpan="4"><strong>COÛT MOYEN PAR M²</strong></td>
                      <td className="highlight-blue">
                        <strong>
                          {(() => {
                            const totalSurfaceBatie = simulationData.typologieBiens.reduce((sum, type) =>
                              sum + (type.surfaceBati * type.quantite), 0
                            );
                            const coutMoyenHT = totalSurfaceBatie > 0
                              ? (financialResults.investissementTotal / (1 + simulationData.tauxTVA / 100)) / totalSurfaceBatie
                              : 0;
                            return formatCurrency(coutMoyenHT);
                          })()}
                        </strong>
                      </td>
                      <td className="highlight-green">
                        <strong>
                          {(() => {
                            const totalSurfaceBatie = simulationData.typologieBiens.reduce((sum, type) =>
                              sum + (type.surfaceBati * type.quantite), 0
                            );
                            const coutMoyenTTC = totalSurfaceBatie > 0
                              ? financialResults.investissementTotal / totalSurfaceBatie
                              : 0;
                            return formatCurrency(coutMoyenTTC);
                          })()}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Strategy Tab */}
        <div className={`tab-content ${activeTab === 'pricing' ? 'active' : ''}`}>
          <div className="section-header">
            <h2>Stratégie de Prix</h2>
            <div className="help-box success-box">
              💡 <strong>Guide des Marges:</strong> Ajustez les niveaux de marge pour définir votre stratégie commerciale.
              Les marges peuvent varier de 10% à 100% selon votre positionnement.
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card gradient-card">
              <div className="card-header">
                <h3 className="card-title">📊 Niveaux de Marge Personnalisables</h3>
              </div>

              <div className="margin-controls">
                <div className="preset-buttons">
                  <button
                    className="btn btn-sm btn-preset"
                    onClick={() => handleInputChange('customMargins', {
                      level1: 15, level2: 25, level3: 35, level4: 45
                    })}
                  >
                    🛡️ Conservateur
                  </button>
                  <button
                    className="btn btn-sm btn-preset"
                    onClick={() => handleInputChange('customMargins', {
                      level1: 30, level2: 50, level3: 70, level4: 90
                    })}
                  >
                    ⚖️ Équilibré
                  </button>
                  <button
                    className="btn btn-sm btn-preset"
                    onClick={() => handleInputChange('customMargins', {
                      level1: 40, level2: 60, level3: 80, level4: 100
                    })}
                  >
                    🚀 Agressif
                  </button>
                </div>

                {Object.entries(simulationData.customMargins).map(([key, value], index) => (
                  <div key={key} className="form-group margin-slider">
                    <label>
                      Niveau {index + 1} - Marge
                      <span className={`margin-badge level-${index + 1}`}>{value}%</span>
                    </label>
                    <div className="slider-container">
                      <input
                        type="range"
                        className={`slider margin-slider-${index + 1}`}
                        min="10"
                        max="100"
                        step="5"
                        value={value}
                        onChange={(e) => handleNestedChange('customMargins', key, parseFloat(e.target.value))}
                      />
                      <div className="slider-labels">
                        <span>10%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card gradient-card">
              <div className="card-header">
                <h3 className="card-title">💰 Grille Tarifaire Finale</h3>
              </div>
              <div className="pricing-table">
                <table className="table-enhanced">
                  <thead>
                    <tr>
                      <th>Type de Bien</th>
                      <th>Surfaces (T/B)</th>
                      {Object.entries(simulationData.customMargins).map(([key, value]) => (
                        <th key={key} className={`price-header level-${key.slice(-1)}`}>
                          Prix Marge {value}%
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {financialResults.detailsParType.map((detail, index) => (
                      <tr key={index}>
                        <td>{detail.nom}</td>
                        <td>{detail.surfaceTerrain}/{detail.surfaceBati} m²</td>
                        {Object.keys(simulationData.customMargins).map(key => (
                          <td key={key} className={`price-cell level-${key.slice(-1)}`}>
                            {formatCurrency(detail.prixParMarge[key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Prix de vente moyen par m² */}
              <div className="pricing-stats" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
                <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#1e40af' }}>
                  📐 PRIX DE VENTE MOYEN PAR M²
                </div>
                <div className="grid grid-4" style={{ gap: '10px' }}>
                  {Object.entries(simulationData.customMargins).map(([key, marginValue], index) => {
                    // Calcul du prix de vente moyen au m² pour chaque niveau de marge
                    const totalRevenue = financialResults.detailsParType.reduce((sum, detail) => {
                      const prixUnitaire = detail.prixParMarge[key] || 0;
                      const quantite = simulationData.typologieBiens.find(t => t.nom === detail.nom)?.quantite || 0;
                      return sum + (prixUnitaire * quantite);
                    }, 0);

                    const totalSurfaceBatie = simulationData.typologieBiens.reduce((sum, type) =>
                      sum + (type.surfaceBati * type.quantite), 0
                    );

                    const prixMoyenM2 = totalSurfaceBatie > 0 ? totalRevenue / totalSurfaceBatie : 0;

                    return (
                      <div key={key} className="stat-item" style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '6px' }}>
                        <span className="stat-label" style={{ fontSize: '12px', color: '#64748b' }}>
                          Niveau {index + 1} ({marginValue}%)
                        </span>
                        <span className="stat-value" style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#1e40af', marginTop: '5px' }}>
                          {formatCurrency(prixMoyenM2)}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>FCFA/m²</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pricing-stats">
                <div className="stat-item">
                  <span className="stat-label">
                    📊 Écart de Prix
                    <Tooltip text="Différence entre le prix de vente le plus élevé (marge maximale) et le prix de vente le plus bas (marge minimale) parmi tous les types de biens. Indique l'amplitude de votre gamme tarifaire." />
                  </span>
                  <span className="stat-value">
                    {formatCurrency(
                      Math.max(...financialResults.detailsParType.map(d => d.prixParMarge.level4 || 0)) -
                      Math.min(...financialResults.detailsParType.map(d => d.prixParMarge.level1 || 0))
                    )}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">
                    💵 Prix Moyen
                    <Tooltip text="Prix de vente moyen calculé avec la marge cible (niveau 2 - généralement 60%) pour l'ensemble des types de biens. Représente le positionnement prix médian de votre projet." />
                  </span>
                  <span className="stat-value">
                    {formatCurrency(
                      financialResults.detailsParType.reduce((acc, d) =>
                        acc + (d.prixParMarge.level2 || 0), 0) / financialResults.detailsParType.length
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card gradient-card mt-3">
            <div className="card-header">
              <h3 className="card-title">🎯 Stratégie de Phasage</h3>
            </div>
            {/* Message de validation si le total n'est pas 100% */}
            {(simulationData.phasage.phase1Percent + simulationData.phasage.phase2Percent + simulationData.phasage.phase3Percent !== 100) && (
              <div className="alert alert-warning" style={{ margin: '15px' }}>
                ⚠️ <strong>Attention:</strong> La somme des trois phases doit être égale à 100%.
                Actuellement: {(simulationData.phasage.phase1Percent + simulationData.phasage.phase2Percent + simulationData.phasage.phase3Percent)}%
              </div>
            )}
            <div className="info-box" style={{ margin: '15px', padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid #3b82f6' }}>
              📊 <strong>Répartition manuelle:</strong> Définissez le pourcentage d'unités pour chaque phase de vente.
              Total actuel: {(simulationData.phasage.phase1Percent + simulationData.phasage.phase2Percent + simulationData.phasage.phase3Percent)}% / 100%
            </div>
            <div className="grid grid-3 phasing-section">
              <div className="form-group">
                <label>
                  Phase 1 - Lancement
                  <Tooltip text="Pourcentage d'unités à vendre en phase initiale avec prix attractif pour créer l'engouement (20-40% recommandé)" />
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={simulationData.phasage.phase1Percent}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (value >= 0 && value <= 100) {
                        handleNestedChange('phasage', 'phase1Percent', value);
                      }
                    }}
                    min="0"
                    max="100"
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
              <div className="form-group">
                <label>
                  Phase 2 - Croissance
                  <Tooltip text="Pourcentage d'unités à vendre en phase de croissance après validation du marché (30-40% recommandé)" />
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={simulationData.phasage.phase2Percent}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (value >= 0 && value <= 100) {
                        handleNestedChange('phasage', 'phase2Percent', value);
                      }
                    }}
                    min="0"
                    max="100"
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
              <div className="form-group">
                <label>
                  Phase 3 - Maturité
                  <Tooltip text="Pourcentage d'unités restantes à vendre en phase finale avec prix premium (20-35% recommandé)" />
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={simulationData.phasage.phase3Percent}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (value >= 0 && value <= 100) {
                        handleNestedChange('phasage', 'phase3Percent', value);
                      }
                    }}
                    min="0"
                    max="100"
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
            </div>
            <div className="grid grid-3 phasing-section" style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label>
                  Augmentation Prix Phase 2
                  <Tooltip text="Majoration du prix par rapport à la phase 1 après validation du marché (5-15% typiquement)" />
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider gradient-slider"
                    min="0"
                    max="30"
                    value={simulationData.phasage.phase2Increase}
                    onChange={(e) => handleNestedChange('phasage', 'phase2Increase', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">+{simulationData.phasage.phase2Increase}%</div>
                </div>
              </div>
              <div className="form-group">
                <label>
                  Augmentation Prix Phase 3
                  <Tooltip text="Majoration finale pour les dernières unités disponibles, capitalisant sur la rareté (10-30% possible)" />
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider gradient-slider"
                    min="0"
                    max="50"
                    value={simulationData.phasage.phase3Increase}
                    onChange={(e) => handleNestedChange('phasage', 'phase3Increase', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">+{simulationData.phasage.phase3Increase}%</div>
                </div>
              </div>
              <div className="form-group">
                <label>
                  Équilibrage Automatique
                  <Tooltip text="Cliquez pour répartir équitablement les unités restantes entre les phases" />
                </label>
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    const phase1 = simulationData.phasage.phase1Percent;
                    const remaining = 100 - phase1;
                    const phase2 = Math.floor(remaining / 2);
                    const phase3 = remaining - phase2;
                    handleInputChange('phasage', {
                      ...simulationData.phasage,
                      phase1Percent: phase1,
                      phase2Percent: phase2,
                      phase3Percent: phase3
                    });
                  }}
                >
                  ⚖️ Équilibrer Phases 2 et 3
                </button>
              </div>
            </div>
          </div>

          {/* Application de la Stratégie de Phasage */}
          <div className="card gradient-card mt-3">
            <div className="card-header">
              <h3 className="card-title">📊 Application de la Stratégie de Phasage</h3>
            </div>

            {/* Vue d'ensemble du phasage */}
            <div className="phasing-overview" style={{ padding: '20px' }}>
              <div className="info-box" style={{ marginBottom: '20px', padding: '15px', background: 'rgba(34, 197, 94, 0.05)', borderLeft: '3px solid #22c55e' }}>
                💡 <strong>Vue d'ensemble:</strong> Distribution des {simulationData.typologieBiens.reduce((sum, type) => sum + type.quantite, 0)} unités sur 3 phases avec augmentations progressives des prix
              </div>

              {/* Tableau de répartition par phase et par type */}
              <div className="phasing-distribution-table" style={{ marginBottom: '30px' }}>
                <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>📋 Répartition des Unités par Type et par Phase</h4>
                <table className="table-enhanced">
                  <thead>
                    <tr>
                      <th rowSpan="2">Type de Bien</th>
                      <th rowSpan="2">Total Unités</th>
                      <th colSpan="2" style={{ textAlign: 'center', background: 'rgba(251, 191, 36, 0.8)', color: '#fff', fontWeight: 'bold' }}>
                        Phase 1 ({simulationData.phasage.phase1Percent}%)
                      </th>
                      <th colSpan="2" style={{ textAlign: 'center', background: 'rgba(34, 197, 94, 0.8)', color: '#fff', fontWeight: 'bold' }}>
                        Phase 2 ({simulationData.phasage.phase2Percent}%)
                      </th>
                      <th colSpan="2" style={{ textAlign: 'center', background: 'rgba(59, 130, 246, 0.8)', color: '#fff', fontWeight: 'bold' }}>
                        Phase 3 ({simulationData.phasage.phase3Percent}%)
                      </th>
                    </tr>
                    <tr>
                      <th style={{ background: 'rgba(251, 191, 36, 0.6)', color: '#fff' }}>Unités</th>
                      <th style={{ background: 'rgba(251, 191, 36, 0.6)', color: '#fff' }}>Prix Unitaire</th>
                      <th style={{ background: 'rgba(34, 197, 94, 0.6)', color: '#fff' }}>Unités</th>
                      <th style={{ background: 'rgba(34, 197, 94, 0.6)', color: '#fff' }}>Prix (+{simulationData.phasage.phase2Increase}%)</th>
                      <th style={{ background: 'rgba(59, 130, 246, 0.6)', color: '#fff' }}>Unités</th>
                      <th style={{ background: 'rgba(59, 130, 246, 0.6)', color: '#fff' }}>Prix (+{simulationData.phasage.phase3Increase}%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationData.typologieBiens.map((type, index) => {
                      const detail = financialResults.detailsParType.find(d => d.nom === type.nom);
                      const basePrice = detail?.prixParMarge.level2 || 0;
                      const phase1Units = Math.round(type.quantite * simulationData.phasage.phase1Percent / 100);
                      const phase2Units = Math.round(type.quantite * simulationData.phasage.phase2Percent / 100);
                      const phase3Units = type.quantite - phase1Units - phase2Units;
                      const phase2Price = basePrice * (1 + simulationData.phasage.phase2Increase / 100);
                      const phase3Price = basePrice * (1 + simulationData.phasage.phase3Increase / 100);

                      return (
                        <tr key={index}>
                          <td><strong>{type.nom}</strong></td>
                          <td style={{ textAlign: 'center' }}>{type.quantite}</td>
                          <td style={{ background: 'rgba(251, 191, 36, 0.05)', textAlign: 'center' }}>{phase1Units}</td>
                          <td style={{ background: 'rgba(251, 191, 36, 0.05)' }}>{formatCurrency(basePrice)}</td>
                          <td style={{ background: 'rgba(34, 197, 94, 0.05)', textAlign: 'center' }}>{phase2Units}</td>
                          <td style={{ background: 'rgba(34, 197, 94, 0.05)' }}>{formatCurrency(phase2Price)}</td>
                          <td style={{ background: 'rgba(59, 130, 246, 0.05)', textAlign: 'center' }}>{phase3Units}</td>
                          <td style={{ background: 'rgba(59, 130, 246, 0.05)' }}>{formatCurrency(phase3Price)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td><strong>TOTAL</strong></td>
                      <td style={{ textAlign: 'center' }}>
                        <strong>{simulationData.typologieBiens.reduce((sum, type) => sum + type.quantite, 0)}</strong>
                      </td>
                      <td colSpan="2" style={{ background: 'rgba(251, 191, 36, 0.1)', textAlign: 'center' }}>
                        <strong>
                          {Math.round(simulationData.typologieBiens.reduce((sum, type) =>
                            sum + type.quantite * simulationData.phasage.phase1Percent / 100, 0)
                          )} unités
                        </strong>
                      </td>
                      <td colSpan="2" style={{ background: 'rgba(34, 197, 94, 0.1)', textAlign: 'center' }}>
                        <strong>
                          {Math.round(simulationData.typologieBiens.reduce((sum, type) =>
                            sum + type.quantite * simulationData.phasage.phase2Percent / 100, 0)
                          )} unités
                        </strong>
                      </td>
                      <td colSpan="2" style={{ background: 'rgba(59, 130, 246, 0.1)', textAlign: 'center' }}>
                        <strong>
                          {simulationData.typologieBiens.reduce((sum, type) => {
                            const phase1 = Math.round(type.quantite * simulationData.phasage.phase1Percent / 100);
                            const phase2 = Math.round(type.quantite * simulationData.phasage.phase2Percent / 100);
                            return sum + (type.quantite - phase1 - phase2);
                          }, 0)} unités
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Tableau récapitulatif financier par phase */}
              <div className="phasing-financial-summary" style={{ marginBottom: '30px' }}>
                <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>💰 Impact Financier du Phasage</h4>
                <div className="grid grid-3">
                  {(() => {
                    const totalUnits = simulationData.typologieBiens.reduce((sum, type) => sum + type.quantite, 0);
                    const phase1Units = Math.round(totalUnits * simulationData.phasage.phase1Percent / 100);
                    const phase2Units = Math.round(totalUnits * simulationData.phasage.phase2Percent / 100);
                    const phase3Units = totalUnits - phase1Units - phase2Units;

                    // Calcul des CA par phase
                    let phase1Revenue = 0;
                    let phase2Revenue = 0;
                    let phase3Revenue = 0;

                    simulationData.typologieBiens.forEach(type => {
                      const detail = financialResults.detailsParType.find(d => d.nom === type.nom);
                      if (detail) {
                        const basePrice = detail.prixParMarge.level2 || 0;
                        const p1Units = Math.round(type.quantite * simulationData.phasage.phase1Percent / 100);
                        const p2Units = Math.round(type.quantite * simulationData.phasage.phase2Percent / 100);
                        const p3Units = type.quantite - p1Units - p2Units;

                        phase1Revenue += p1Units * basePrice;
                        phase2Revenue += p2Units * basePrice * (1 + simulationData.phasage.phase2Increase / 100);
                        phase3Revenue += p3Units * basePrice * (1 + simulationData.phasage.phase3Increase / 100);
                      }
                    });

                    const totalRevenue = phase1Revenue + phase2Revenue + phase3Revenue;
                    const investmentPerUnit = financialResults.investissementTotal / totalUnits;

                    return (
                      <>
                        <div className="result-card" style={{ background: 'var(--gradient-1)' }}>
                          <div className="result-icon">🚀</div>
                          <div className="result-label">Phase 1 - Lancement</div>
                          <div className="result-value">{formatNumber(phase1Revenue / 1000000)}</div>
                          <div className="result-unit">Millions FCFA</div>
                          <div style={{ fontSize: '12px', marginTop: '10px', opacity: '0.8' }}>
                            {phase1Units} unités • Prix standard
                          </div>
                        </div>
                        <div className="result-card" style={{ background: 'var(--gradient-2)' }}>
                          <div className="result-icon">📈</div>
                          <div className="result-label">Phase 2 - Croissance</div>
                          <div className="result-value">{formatNumber(phase2Revenue / 1000000)}</div>
                          <div className="result-unit">Millions FCFA</div>
                          <div style={{ fontSize: '12px', marginTop: '10px', opacity: '0.8' }}>
                            {phase2Units} unités • Prix +{simulationData.phasage.phase2Increase}%
                          </div>
                        </div>
                        <div className="result-card" style={{ background: 'var(--gradient-3)' }}>
                          <div className="result-icon">💎</div>
                          <div className="result-label">Phase 3 - Maturité</div>
                          <div className="result-value">{formatNumber(phase3Revenue / 1000000)}</div>
                          <div className="result-unit">Millions FCFA</div>
                          <div style={{ fontSize: '12px', marginTop: '10px', opacity: '0.8' }}>
                            {phase3Units} unités • Prix +{simulationData.phasage.phase3Increase}%
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Graphique d'évolution des revenus cumulés */}
              <div className="phasing-chart-section">
                <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>📈 Évolution des Revenus et Marges par Phase</h4>
                <div className="chart-container" style={{ height: '400px' }}>
                  <canvas id="phasingApplicationChart"></canvas>
                </div>
              </div>

              {/* Indicateurs clés */}
              <div className="phasing-kpis" style={{ marginTop: '30px' }}>
                <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>🎯 Indicateurs Clés de Performance</h4>
                <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {(() => {
                    let phase1Revenue = 0;
                    let phase2Revenue = 0;
                    let phase3Revenue = 0;

                    simulationData.typologieBiens.forEach(type => {
                      const detail = financialResults.detailsParType.find(d => d.nom === type.nom);
                      if (detail) {
                        const basePrice = detail.prixParMarge.level2 || 0;
                        const p1Units = Math.round(type.quantite * simulationData.phasage.phase1Percent / 100);
                        const p2Units = Math.round(type.quantite * simulationData.phasage.phase2Percent / 100);
                        const p3Units = type.quantite - p1Units - p2Units;

                        phase1Revenue += p1Units * basePrice;
                        phase2Revenue += p2Units * basePrice * (1 + simulationData.phasage.phase2Increase / 100);
                        phase3Revenue += p3Units * basePrice * (1 + simulationData.phasage.phase3Increase / 100);
                      }
                    });

                    const totalPhasedRevenue = phase1Revenue + phase2Revenue + phase3Revenue;
                    const baseRevenue = financialResults.detailsParType.reduce((sum, detail) =>
                      sum + (detail.prixParMarge.level2 * detail.quantite), 0
                    );
                    const additionalRevenue = totalPhasedRevenue - baseRevenue;
                    const averagePriceIncrease = ((totalPhasedRevenue / baseRevenue - 1) * 100).toFixed(1);

                    return (
                      <>
                        <div className="kpi-item" style={{ padding: '15px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>CA Total avec Phasage</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
                            {formatNumber(totalPhasedRevenue / 1000000)}M FCFA
                          </div>
                        </div>
                        <div className="kpi-item" style={{ padding: '15px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Gain du Phasage</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e' }}>
                            +{formatNumber(additionalRevenue / 1000000)}M FCFA
                          </div>
                        </div>
                        <div className="kpi-item" style={{ padding: '15px', background: 'rgba(251, 146, 60, 0.05)', borderRadius: '8px', borderLeft: '3px solid #fb923c' }}>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Augmentation Moyenne</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fb923c' }}>
                            +{averagePriceIncrease}%
                          </div>
                        </div>
                        <div className="kpi-item" style={{ padding: '15px', background: 'rgba(168, 85, 247, 0.05)', borderRadius: '8px', borderLeft: '3px solid #a855f7' }}>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>ROI avec Phasage</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a855f7' }}>
                            {((totalPhasedRevenue - financialResults.investissementTotal) / financialResults.investissementTotal * 100).toFixed(1)}%
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benchmarking Tab */}
        <div className={`tab-content ${activeTab === 'benchmark' ? 'active' : ''}`}>
          <div className="section-header">
            <h2>Analyse Concurrentielle</h2>
            <div className="help-box warning-box">
              💡 <strong>Benchmarking:</strong> Comparez votre projet avec les concurrents du marché.
              Le coefficient de localisation ajuste les prix selon l'attractivité relative des zones.
            </div>
          </div>

          <div className="competitors-grid">
            {simulationData.concurrents.map((concurrent, index) => (
              <div key={index} className="competitor-card gradient-card editable-competitor">
                <div className="competitor-header">
                  <input
                    type="text"
                    className="form-control competitor-name"
                    value={concurrent.nom}
                    onChange={(e) => handleCompetitorChange(index, 'nom', e.target.value)}
                    placeholder="Nom du concurrent"
                  />
                  {simulationData.concurrents.length > 1 && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeCompetitor(index)}
                      title="Supprimer ce concurrent"
                    >
                      ✖
                    </button>
                  )}
                </div>

                <div className="competitor-details editable">
                  <div className="form-group">
                    <label>📍 Localisation</label>
                    <input
                      type="text"
                      className="form-control"
                      value={concurrent.localisation}
                      onChange={(e) => handleCompetitorChange(index, 'localisation', e.target.value)}
                      placeholder="Localisation"
                    />
                  </div>

                  <div className="form-group">
                    <label>🏠 Typologie des Biens</label>
                    <input
                      type="text"
                      className="form-control"
                      value={concurrent.typologie || ''}
                      onChange={(e) => handleCompetitorChange(index, 'typologie', e.target.value)}
                      placeholder="Ex: Villas Duplex 4-5P"
                    />
                  </div>

                  <div className="form-group">
                    <label>💰 Prix/m² (FCFA)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={concurrent.prixMoyenM2}
                      onChange={(e) => handleCompetitorChange(index, 'prixMoyenM2', parseFloat(e.target.value) || 0)}
                      placeholder="Prix moyen au m²"
                    />
                  </div>

                  <div className="form-group">
                    <label>📊 Coefficient</label>
                    <div className="slider-container">
                      <input
                        type="range"
                        className="slider gradient-slider"
                        min="0.5"
                        max="2"
                        step="0.05"
                        value={concurrent.coefficient}
                        onChange={(e) => handleCompetitorChange(index, 'coefficient', parseFloat(e.target.value))}
                      />
                      <div className="slider-value">{concurrent.coefficient}x</div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>🎯 Positionnement</label>
                    <select
                      className="form-control"
                      value={concurrent.positionnement}
                      onChange={(e) => handleCompetitorChange(index, 'positionnement', e.target.value)}
                    >
                      <option value="economic">🏘️ Économique</option>
                      <option value="standard">🏢 Standard</option>
                      <option value="premium">💎 Premium</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {simulationData.concurrents.length < 10 && (
              <div className="competitor-card gradient-card add-competitor-card">
                <button
                  className="btn btn-primary btn-add-competitor"
                  onClick={addCompetitor}
                >
                  <span className="add-icon">+</span>
                  <span>Ajouter un Concurrent</span>
                </button>
              </div>
            )}
          </div>

          <div className="card gradient-card mt-3">
            <div className="card-header">
              <h3 className="card-title">📊 Comparaison des Prix au m²</h3>
            </div>
            <div className="chart-container">
              <canvas id="competitorChart"></canvas>
            </div>
          </div>

          <div className="card gradient-card mt-3">
            <div className="card-header">
              <h3 className="card-title">🎯 Positionnement Stratégique</h3>
            </div>
            <div className="positioning-analysis">
              {(() => {
                const analysis = analyzeCompetitivePosition();
                return (
                  <div className="positioning-grid">
                    <div className="positioning-item">
                      <h5>🌟 Avantages Concurrentiels</h5>
                      <ul>
                        {analysis.advantages.map((advantage, idx) => (
                          <li key={idx}>{advantage}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="positioning-item">
                      <h5>📈 Recommandations Stratégiques</h5>
                      <ul>
                        {analysis.recommendations.map((recommendation, idx) => (
                          <li key={idx}>{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                    {analysis.weaknesses.length > 0 && (
                      <div className="positioning-item">
                        <h5>⚠️ Points d'Attention</h5>
                        <ul>
                          {analysis.weaknesses.map((weakness, idx) => (
                            <li key={idx}>{weakness}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Analysis Tab */}
        <div className={`tab-content ${activeTab === 'analysis' ? 'active' : ''}`}>
          <div className="section-header">
            <h2>Analyse Financière</h2>
            <div className="help-box info-box">
              💡 <strong>Analyse:</strong> Étudiez la rentabilité selon différents scénarios de marge
              et visualisez l'impact sur le ROI et le chiffre d'affaires.
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card gradient-card">
              <div className="card-header">
                <h3 className="card-title">📊 Analyse des Marges et ROI</h3>
              </div>
              <div className="chart-container">
                <canvas id="marginChart"></canvas>
              </div>
            </div>

            <div className="card gradient-card">
              <div className="card-header">
                <h3 className="card-title">🎯 Répartition du Chiffre d'Affaires</h3>
              </div>
              <div className="chart-container">
                <canvas id="phaseChart"></canvas>
              </div>
            </div>
          </div>

          <div className="card gradient-card mt-3">
            <div className="card-header">
              <h3 className="card-title">📋 Analyse de Rentabilité par Scénario</h3>
            </div>
            <div className="rentability-table">
              <table className="table-enhanced">
                <thead>
                  <tr>
                    <th>Scénario</th>
                    <th>Marge (%)</th>
                    <th>Investissement</th>
                    <th>CA Projeté</th>
                    <th>Marge Nette</th>
                    <th className="highlight-roi">ROI (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {financialResults.analyseRentabilite.map((analyse, index) => (
                    <tr key={index} className={analyse.roi > 50 ? 'profitable' : ''}>
                      <td>Niveau {index + 1}</td>
                      <td>{analyse.marge}%</td>
                      <td>{formatCurrency(financialResults.investissementTotal)}</td>
                      <td>{formatCurrency(analyse.chiffreAffaires)}</td>
                      <td className={analyse.margeNette > 0 ? 'positive' : 'negative'}>
                        {formatCurrency(analyse.margeNette)}
                      </td>
                      <td className={`highlight-roi ${analyse.roi > 50 ? 'high-roi' : 'low-roi'}`}>
                        {analyse.roi.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Results/Simulation Tab */}
        <div className={`tab-content ${activeTab === 'simulation' ? 'active' : ''}`}>
          <div className="section-header">
            <h2>Résultats de la Simulation</h2>
          </div>

          <div className="results-grid enhanced">
            <div className="result-card gradient-1">
              <div className="result-icon">💰</div>
              <div className="result-label">Investissement Total</div>
              <div className="result-value">{formatNumber(financialResults.investissementTotal / 1000000)}</div>
              <div className="result-unit">Millions FCFA</div>
            </div>
            <div className="result-card gradient-2">
              <div className="result-icon">📈</div>
              <div className="result-label">Chiffre d'Affaires</div>
              <div className="result-value">{formatNumber(financialResults.chiffreAffairesProjete / 1000000)}</div>
              <div className="result-unit">Millions FCFA</div>
            </div>
            <div className="result-card gradient-3">
              <div className="result-icon">💵</div>
              <div className="result-label">Marge Nette</div>
              <div className="result-value">{formatNumber(financialResults.margeNette / 1000000)}</div>
              <div className="result-unit">Millions FCFA</div>
            </div>
            <div className="result-card gradient-4">
              <div className="result-icon">🎯</div>
              <div className="result-label">ROI</div>
              <div className="result-value">{Math.round(financialResults.roi)}</div>
              <div className="result-unit">%</div>
            </div>
          </div>

          <div className="grid grid-2 mt-4">
            <div className="card gradient-card">
              <div className="card-header">
                <h3 className="card-title">📊 Répartition des Coûts par Type</h3>
              </div>
              <div className="chart-container">
                <canvas id="costChart"></canvas>
              </div>
            </div>

            <div className="card gradient-card">
              <div className="card-header">
                <h3 className="card-title">📈 Évolution des Ventes par Phase</h3>
              </div>
              <div className="chart-container">
                <canvas id="salesChart"></canvas>
              </div>
            </div>
          </div>

          <div className="card gradient-card mt-3">
            <div className="card-header">
              <h3 className="card-title">🎯 Recommandations Stratégiques</h3>
            </div>
            <div className="recommendations">
              <div className="recommendation-grid">
                {generateStrategicRecommendations().map((recommendation, index) => (
                  <div key={index} className="recommendation-item">
                    <h5>{recommendation.title}</h5>
                    <p>{recommendation.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorEnhanced;