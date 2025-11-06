import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetInfo, setResetInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setMessage('Un email de réinitialisation a été envoyé à votre adresse email.');

        // En développement, afficher le lien directement
        if (response.resetUrl) {
          setResetInfo({
            url: response.resetUrl,
            token: response.token
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🏗️ Simulateur Immobilier</h1>
          <h2>Mot de passe oublié</h2>
          <p>Entrez votre adresse email pour réinitialiser votre mot de passe</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {message && (
          <div className="alert alert-success">
            {message}
          </div>
        )}

        {/* Affichage du lien en développement */}
        {resetInfo && (
          <div className="alert alert-info" style={{ marginTop: '20px' }}>
            <strong>Mode développement - Lien de réinitialisation :</strong>
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f0f0f0',
              borderRadius: '5px',
              wordBreak: 'break-all'
            }}>
              <a href={resetInfo.url} target="_blank" rel="noopener noreferrer">
                {resetInfo.url}
              </a>
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
              Token : {resetInfo.token}
            </div>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="exemple@email.com"
              disabled={loading || message}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || message}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Envoi en cours...
              </>
            ) : (
              'Envoyer le lien de réinitialisation'
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
            <span className="info-icon">📧</span>
            <div>
              <strong>Email de réinitialisation</strong>
              <p>Vous recevrez un lien valide pendant 1 heure</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🔒</span>
            <div>
              <strong>Sécurité garantie</strong>
              <p>Processus de réinitialisation sécurisé</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;