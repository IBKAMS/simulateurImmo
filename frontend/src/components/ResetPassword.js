import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import authService from '../services/authService';
import './Auth.css';

const ResetPassword = ({ onLogin }) => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Vérifier la validité du token au chargement
    const verifyToken = async () => {
      try {
        const response = await authService.verifyResetToken(token);
        if (response.success) {
          setTokenValid(true);
        } else {
          setError('Le lien de réinitialisation est invalide ou a expiré.');
          setTokenValid(false);
        }
      } catch (err) {
        setError('Le lien de réinitialisation est invalide ou a expiré.');
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setValidatingToken(false);
      setError('Token de réinitialisation manquant.');
    }
  }, [token]);

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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setLoading(false);
      return;
    }

    if (!/\d/.test(formData.password)) {
      setError('Le mot de passe doit contenir au moins un chiffre.');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.resetPassword(token, formData.password);
      if (response.success) {
        // Connexion automatique après réinitialisation réussie
        if (response.token && response.user) {
          onLogin(response.user);
          navigate('/simulator-enhanced');
        } else {
          navigate('/login');
        }
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la réinitialisation du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>🏗️ Simulateur Immobilier</h1>
            <h2>Vérification en cours...</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <span className="spinner-small"></span>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>🏗️ Simulateur Immobilier</h1>
            <h2>Lien invalide</h2>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="auth-footer">
            <p>
              <Link to="/forgot-password" className="auth-link">
                Demander un nouveau lien de réinitialisation
              </Link>
            </p>
            <p style={{ marginTop: '10px' }}>
              <Link to="/login" className="auth-link">
                ← Retour à la connexion
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🏗️ Simulateur Immobilier</h1>
          <h2>Réinitialiser le mot de passe</h2>
          <p>Entrez votre nouveau mot de passe</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">Nouveau mot de passe</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="form-control password-input"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <span className="eye-icon">👁️</span>
                ) : (
                  <span className="eye-icon">👁️‍🗨️</span>
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                className="form-control password-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
                aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showConfirmPassword ? (
                  <span className="eye-icon">👁️</span>
                ) : (
                  <span className="eye-icon">👁️‍🗨️</span>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Réinitialisation en cours...
              </>
            ) : (
              'Réinitialiser le mot de passe'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login" className="auth-link">
              ← Retour à la connexion
            </Link>
          </p>
        </div>

        <div className="auth-info">
          <div className="info-item">
            <span className="info-icon">🔐</span>
            <div>
              <strong>Nouveau mot de passe</strong>
              <p>Minimum 6 caractères avec au moins 1 chiffre</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">✅</span>
            <div>
              <strong>Connexion automatique</strong>
              <p>Vous serez connecté après la réinitialisation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;