import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Auth.css';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      if (response.success) {
        onLogin(response.user);
        navigate('/simulator');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🏗️ Simulateur Immobilier</h1>
          <h2>Connexion</h2>
          <p>Accédez à votre espace de simulation tarifaire</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="exemple@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Pas encore de compte ?{' '}
            <Link to="/register" className="auth-link">
              Créer un compte
            </Link>
          </p>
        </div>

        <div className="auth-info">
          <div className="info-item">
            <span className="info-icon">✨</span>
            <div>
              <strong>ALIZ STRATEGY</strong>
              <p>Plateforme professionnelle de simulation tarifaire immobilière</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🔒</span>
            <div>
              <strong>Sécurisé</strong>
              <p>Vos données sont protégées et cryptées</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📊</span>
            <div>
              <strong>Analyse complète</strong>
              <p>Calculs de rentabilité et ROI en temps réel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;