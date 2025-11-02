import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Chart from 'chart.js/auto';
import simulationService from '../services/simulationService';
import './Simulator.css';

const Simulator = ({ user, onLogout }) => {
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

  // État principal de la simulation
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
      }
    ],
    vrdCout: 10,
    fraisEtudes: 7,
    fraisFinanciers: 3,
    tauxTVA: 18,
    marges: {
      penetration: 30,
      target: 60,
      premium: 80,
      premiumPlus: 100
    },
    phasage: {
      phase1Percent: 30,
      phase2Increase: 5,
      phase3Increase: 10
    },
    concurrents: [
      { nom: 'Italia Construction', localisation: 'Grand-Bassam', prixMoyenM2: 461500, positionnement: 'standard' },
      { nom: 'Ghandour Construction', localisation: 'Grand-Bassam', prixMoyenM2: 700000, positionnement: 'premium' },
      { nom: 'Kaydan Groupe', localisation: 'Ahoué PK24', prixMoyenM2: 463000, positionnement: 'economic' }
    ]
  });

  // Résultats calculés
  const [financialResults, setFinancialResults] = useState({
    investissementTotal: 0,
    chiffreAffairesProjete: 0,
    margeNette: 0,
    roi: 0
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

  // Initialiser les graphiques
  useEffect(() => {
    if (activeTab === 'simulation') {
      updateCharts();
    }
    return () => {
      // Nettoyer les graphiques
      if (costChartRef.current) costChartRef.current.destroy();
      if (benchmarkChartRef.current) benchmarkChartRef.current.destroy();
      if (salesChartRef.current) salesChartRef.current.destroy();
      if (profitChartRef.current) profitChartRef.current.destroy();
    };
  }, [activeTab, financialResults]);

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
    const results = simulationService.calculateFinancials(simulationData);
    setFinancialResults(results);
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

  const addPropertyType = () => {
    const newType = {
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
          navigate(`/simulator?id=${response.simulation._id}`, { replace: true });
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

  const updateCharts = () => {
    // Détruire les graphiques existants
    if (costChartRef.current) costChartRef.current.destroy();
    if (salesChartRef.current) salesChartRef.current.destroy();
    if (profitChartRef.current) profitChartRef.current.destroy();

    // Graphique des coûts
    const costCanvas = document.getElementById('costChart');
    if (costCanvas) {
      costChartRef.current = new Chart(costCanvas, {
        type: 'bar',
        data: {
          labels: simulationData.typologieBiens.map(t => t.nom),
          datasets: [{
            label: 'Coût par type (M FCFA)',
            data: simulationData.typologieBiens.map(t => {
              const cost = (t.surfaceTerrain * simulationData.coutFoncier +
                           t.surfaceBati * t.coutConstruction) * t.quantite / 1000000;
              return Math.round(cost);
            }),
            backgroundColor: 'rgba(37, 99, 235, 0.7)',
            borderColor: 'rgba(37, 99, 235, 1)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // Graphique des ventes
    const salesCanvas = document.getElementById('salesChart');
    if (salesCanvas) {
      salesChartRef.current = new Chart(salesCanvas, {
        type: 'line',
        data: {
          labels: ['Phase 1', 'Phase 2', 'Phase 3'],
          datasets: [{
            label: 'CA Cumulé (M FCFA)',
            data: [
              financialResults.chiffreAffairesProjete * 0.3 / 1000000,
              financialResults.chiffreAffairesProjete * 0.65 / 1000000,
              financialResults.chiffreAffairesProjete / 1000000
            ],
            borderColor: 'rgba(139, 92, 246, 1)',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // Graphique de rentabilité
    const profitCanvas = document.getElementById('profitChart');
    if (profitCanvas) {
      const margins = [
        simulationData.marges.penetration,
        simulationData.marges.target,
        simulationData.marges.premium,
        simulationData.marges.premiumPlus
      ];

      profitChartRef.current = new Chart(profitCanvas, {
        type: 'bar',
        data: {
          labels: margins.map(m => `Marge ${m}%`),
          datasets: [{
            label: 'Bénéfice (M FCFA)',
            data: margins.map(margin => {
              const revenue = financialResults.investissementTotal * (1 + margin/100);
              const profit = revenue - financialResults.investissementTotal;
              return Math.round(profit / 1000000);
            }),
            backgroundColor: margins.map(m => m > 60 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(245, 158, 11, 0.7)'),
            borderColor: margins.map(m => m > 60 ? 'rgba(16, 185, 129, 1)' : 'rgba(245, 158, 11, 1)'),
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(num));
  };

  const formatCurrency = (value) => {
    return formatNumber(value) + ' FCFA';
  };

  return (
    <div className="simulator-container">
      <div className="simulator-header">
        <div className="header-left">
          <h1>🏗️ Simulateur de Tarification Immobilière</h1>
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
            Déconnexion
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
            🏷️ Prix & Marges
          </button>
          <button
            className={`tab ${activeTab === 'simulation' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulation')}
          >
            📈 Simulation
          </button>
        </div>

        {/* Configuration Tab */}
        <div className={`tab-content ${activeTab === 'config' ? 'active' : ''}`}>
          <h2>Configuration du Projet</h2>

          <div className="grid grid-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📍 Informations Générales</h3>
              </div>

              <div className="form-group">
                <label>Nom du Projet</label>
                <input
                  type="text"
                  className="form-control"
                  value={simulationData.nomProjet}
                  onChange={(e) => handleInputChange('nomProjet', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Localisation</label>
                <input
                  type="text"
                  className="form-control"
                  value={simulationData.localisation}
                  onChange={(e) => handleInputChange('localisation', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Type de Zone</label>
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
                  <option value="strategic">🌟 Zone Stratégique (Coef. 1.5x)</option>
                  <option value="premium">💎 Zone Premium (Coef. 1.25x)</option>
                  <option value="standard">🏢 Zone Standard (Coef. 1.0x)</option>
                  <option value="economic">🏘️ Zone Économique (Coef. 0.8x)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Coefficient de Localisation</label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider"
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

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🏠 Typologie des Biens</h3>
              </div>

              {simulationData.typologieBiens.map((type) => (
                <div key={type.id} className="property-type-item">
                  <div className="type-header">
                    <input
                      type="text"
                      className="form-control"
                      value={type.nom}
                      onChange={(e) => handlePropertyTypeChange(type.id, 'nom', e.target.value)}
                      style={{ marginBottom: '10px' }}
                    />
                    {simulationData.typologieBiens.length > 1 && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => removePropertyType(type.id)}
                      >
                        ✖
                      </button>
                    )}
                  </div>
                  <div className="property-type-grid">
                    <div>
                      <label>Terrain (m²)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={type.surfaceTerrain}
                        onChange={(e) => handlePropertyTypeChange(type.id, 'surfaceTerrain', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <label>Bâti (m²)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={type.surfaceBati}
                        onChange={(e) => handlePropertyTypeChange(type.id, 'surfaceBati', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <label>Quantité</label>
                      <input
                        type="number"
                        className="form-control"
                        value={type.quantite}
                        onChange={(e) => handlePropertyTypeChange(type.id, 'quantite', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {simulationData.typologieBiens.length < 10 && (
                <button className="btn btn-primary btn-block" onClick={addPropertyType}>
                  + Ajouter un Type
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📏 Paramètres Fonciers</h3>
            </div>
            <div className="grid grid-3">
              <div className="form-group">
                <label>Surface Totale du Terrain</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={simulationData.surfaceTotaleTerrain}
                    onChange={(e) => handleInputChange('surfaceTotaleTerrain', parseFloat(e.target.value))}
                  />
                  <span className="input-suffix">m²</span>
                </div>
              </div>
              <div className="form-group">
                <label>Coût du Foncier</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={simulationData.coutFoncier}
                    onChange={(e) => handleInputChange('coutFoncier', parseFloat(e.target.value))}
                  />
                  <span className="input-suffix">FCFA/m²</span>
                </div>
              </div>
              <div className="form-group">
                <label>Type de Titre Foncier</label>
                <select
                  className="form-control"
                  value={simulationData.typeTitreFoncier}
                  onChange={(e) => handleInputChange('typeTitreFoncier', e.target.value)}
                >
                  <option value="acd">✅ ACD - Arrêté de Concession Définitive</option>
                  <option value="permit">📋 Permis d'Occuper</option>
                  <option value="lease">📄 Bail Emphytéotique</option>
                  <option value="title">📜 Titre Foncier</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Costs Tab */}
        <div className={`tab-content ${activeTab === 'costs' ? 'active' : ''}`}>
          <h2>Analyse des Coûts</h2>

          <div className="grid grid-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🏗️ Coûts de Construction</h3>
              </div>

              {simulationData.typologieBiens.map((type) => (
                <div key={type.id} className="form-group">
                  <label>{type.nom}</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      value={type.coutConstruction}
                      onChange={(e) => handlePropertyTypeChange(type.id, 'coutConstruction', parseFloat(e.target.value))}
                    />
                    <span className="input-suffix">FCFA/m²</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">💵 Frais Additionnels</h3>
              </div>

              <div className="form-group">
                <label>VRD et Aménagements</label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider"
                    min="5"
                    max="25"
                    value={simulationData.vrdCout}
                    onChange={(e) => handleInputChange('vrdCout', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">{simulationData.vrdCout}%</div>
                </div>
              </div>

              <div className="form-group">
                <label>Frais d'Études et Maîtrise d'Œuvre</label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider"
                    min="3"
                    max="15"
                    value={simulationData.fraisEtudes}
                    onChange={(e) => handleInputChange('fraisEtudes', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">{simulationData.fraisEtudes}%</div>
                </div>
              </div>

              <div className="form-group">
                <label>Frais Financiers</label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider"
                    min="0"
                    max="10"
                    value={simulationData.fraisFinanciers}
                    onChange={(e) => handleInputChange('fraisFinanciers', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">{simulationData.fraisFinanciers}%</div>
                </div>
              </div>

              <div className="form-group">
                <label>TVA</label>
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
        </div>

        {/* Pricing Tab */}
        <div className={`tab-content ${activeTab === 'pricing' ? 'active' : ''}`}>
          <h2>Stratégie de Prix et Marges</h2>

          <div className="grid grid-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📊 Scénarios de Marge</h3>
              </div>

              <div className="form-group">
                <label>Niveau 1 - Marge de Pénétration</label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider"
                    min="10"
                    max="100"
                    value={simulationData.marges.penetration}
                    onChange={(e) => handleNestedChange('marges', 'penetration', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">{simulationData.marges.penetration}%</div>
                </div>
              </div>

              <div className="form-group">
                <label>Niveau 2 - Marge Cible</label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider"
                    min="10"
                    max="100"
                    value={simulationData.marges.target}
                    onChange={(e) => handleNestedChange('marges', 'target', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">{simulationData.marges.target}%</div>
                </div>
              </div>

              <div className="form-group">
                <label>Niveau 3 - Marge Premium</label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider"
                    min="10"
                    max="100"
                    value={simulationData.marges.premium}
                    onChange={(e) => handleNestedChange('marges', 'premium', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">{simulationData.marges.premium}%</div>
                </div>
              </div>

              <div className="form-group">
                <label>Niveau 4 - Marge Premium Plus</label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider"
                    min="10"
                    max="100"
                    value={simulationData.marges.premiumPlus}
                    onChange={(e) => handleNestedChange('marges', 'premiumPlus', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">{simulationData.marges.premiumPlus}%</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🎯 Stratégie de Phasage</h3>
              </div>

              <div className="form-group">
                <label>Phase 1 - Lancement</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={simulationData.phasage.phase1Percent}
                    onChange={(e) => handleNestedChange('phasage', 'phase1Percent', parseFloat(e.target.value))}
                    min="10"
                    max="50"
                  />
                  <span className="input-suffix">% des unités</span>
                </div>
              </div>

              <div className="form-group">
                <label>Augmentation Phase 2</label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider"
                    min="0"
                    max="30"
                    value={simulationData.phasage.phase2Increase}
                    onChange={(e) => handleNestedChange('phasage', 'phase2Increase', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">+{simulationData.phasage.phase2Increase}%</div>
                </div>
              </div>

              <div className="form-group">
                <label>Augmentation Phase 3</label>
                <div className="slider-container">
                  <input
                    type="range"
                    className="slider"
                    min="0"
                    max="50"
                    value={simulationData.phasage.phase3Increase}
                    onChange={(e) => handleNestedChange('phasage', 'phase3Increase', parseFloat(e.target.value))}
                  />
                  <div className="slider-value">+{simulationData.phasage.phase3Increase}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Tab */}
        <div className={`tab-content ${activeTab === 'simulation' ? 'active' : ''}`}>
          <h2>Simulation Financière Globale</h2>

          <div className="results-grid">
            <div className="result-card" style={{background: 'var(--gradient-1)'}}>
              <div className="result-label">Investissement Total</div>
              <div className="result-value">{formatNumber(financialResults.investissementTotal / 1000000)}</div>
              <div className="result-unit">Millions FCFA</div>
            </div>
            <div className="result-card" style={{background: 'var(--gradient-2)'}}>
              <div className="result-label">Chiffre d'Affaires</div>
              <div className="result-value">{formatNumber(financialResults.chiffreAffairesProjete / 1000000)}</div>
              <div className="result-unit">Millions FCFA</div>
            </div>
            <div className="result-card" style={{background: 'var(--gradient-3)'}}>
              <div className="result-label">Marge Brute</div>
              <div className="result-value">{formatNumber(financialResults.margeNette / 1000000)}</div>
              <div className="result-unit">Millions FCFA</div>
            </div>
            <div className="result-card" style={{background: 'var(--gradient-4)'}}>
              <div className="result-label">ROI</div>
              <div className="result-value">{Math.round(financialResults.roi)}</div>
              <div className="result-unit">%</div>
            </div>
          </div>

          <div className="grid grid-2" style={{marginTop: '25px'}}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📊 Répartition des Coûts</h3>
              </div>
              <div className="chart-container">
                <canvas id="costChart"></canvas>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📈 Évolution des Ventes</h3>
              </div>
              <div className="chart-container">
                <canvas id="salesChart"></canvas>
              </div>
            </div>
          </div>

          <div className="card" style={{marginTop: '25px'}}>
            <div className="card-header">
              <h3 className="card-title">💰 Analyse de Rentabilité</h3>
            </div>
            <div className="chart-container">
              <canvas id="profitChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;