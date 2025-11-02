import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import simulationService from '../services/simulationService';
import authService from '../services/authService';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadSimulations();
    loadStatistics();
  }, []);

  const loadSimulations = async () => {
    try {
      const response = await simulationService.getSimulations();
      if (response.success) {
        setSimulations(response.simulations);
      }
    } catch (err) {
      setError('Erreur lors du chargement des simulations');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await simulationService.getStatistics();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette simulation ?')) {
      try {
        await simulationService.deleteSimulation(id);
        setSimulations(simulations.filter(s => s._id !== id));
        loadStatistics();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const response = await simulationService.duplicateSimulation(id);
      if (response.success) {
        loadSimulations();
      }
    } catch (err) {
      setError('Erreur lors de la duplication');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await simulationService.changeSimulationStatus(id, newStatus);
      loadSimulations();
    } catch (err) {
      setError('Erreur lors du changement de statut');
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(num));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge badge-info',
      validated: 'badge badge-success',
      archived: 'badge badge-warning'
    };
    const labels = {
      draft: 'Brouillon',
      validated: 'Validée',
      archived: 'Archivée'
    };
    return <span className={badges[status] || 'badge'}>{labels[status] || status}</span>;
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <div className="dashboard-nav">
          <h1>📊 Tableau de bord</h1>
          <div className="nav-actions">
            <Link to="/simulator-enhanced" className="btn btn-primary">
              🚀 Nouvelle Simulation Pro
            </Link>
            <button onClick={onLogout} className="btn btn-outline">
              Déconnexion
            </button>
          </div>
        </div>

        <div className="user-info">
          <p>Bienvenu(e), <strong>{user?.email}</strong></p>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="results-grid">
          <div className="result-card" style={{background: 'var(--gradient-1)'}}>
            <div className="result-label">Total Simulations</div>
            <div className="result-value">{stats.totalSimulations}</div>
          </div>
          <div className="result-card" style={{background: 'var(--gradient-2)'}}>
            <div className="result-label">Investissement Total</div>
            <div className="result-value">{formatNumber(stats.totalInvestissement / 1000000)}M</div>
            <div className="result-unit">FCFA</div>
          </div>
          <div className="result-card" style={{background: 'var(--gradient-3)'}}>
            <div className="result-label">CA Projeté</div>
            <div className="result-value">{formatNumber(stats.totalChiffreAffaires / 1000000)}M</div>
            <div className="result-unit">FCFA</div>
          </div>
          <div className="result-card" style={{background: 'var(--gradient-4)'}}>
            <div className="result-label">ROI Moyen</div>
            <div className="result-value">{Math.round(stats.averageROI)}%</div>
          </div>
        </div>
      )}

      {/* Liste des simulations */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Mes Simulations</h3>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : simulations.length === 0 ? (
          <div className="empty-state">
            <p>Aucune simulation trouvée.</p>
            <Link to="/simulator-enhanced" className="btn btn-primary">
              🚀 Créer votre première simulation Pro
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nom du Projet</th>
                  <th>Localisation</th>
                  <th>Investissement</th>
                  <th>ROI</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map(sim => (
                  <tr key={sim._id}>
                    <td>
                      <strong>{sim.nomProjet}</strong>
                    </td>
                    <td>{sim.localisation}</td>
                    <td>{formatNumber(sim.investissementTotal)} FCFA</td>
                    <td>
                      <span className="badge badge-info">
                        {Math.round(sim.roi)}%
                      </span>
                    </td>
                    <td>{getStatusBadge(sim.status)}</td>
                    <td>{formatDate(sim.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-view"
                          onClick={() => navigate(`/simulator-enhanced?id=${sim._id}`)}
                          title="Voir"
                        >
                          👁️
                        </button>
                        <button
                          className="btn-action btn-duplicate"
                          onClick={() => handleDuplicate(sim._id)}
                          title="Dupliquer"
                        >
                          📋
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(sim._id)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;