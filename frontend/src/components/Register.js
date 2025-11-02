import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Auth.css';

const Register = ({ onRegister }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    entreprise: '',
    telephone: ''
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

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (!/\d/.test(formData.password)) {
      setError('Le mot de passe doit contenir au moins un chiffre');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authService.register(registerData);

      if (response.success) {
        onRegister(response.user);
        navigate('/simulator');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-large">
        <div className="auth-header">
          <h1>🏗️ Simulateur Immobilier</h1>
          <h2>Créer un compte</h2>
          <p>Rejoignez ALIZ STRATEGY pour vos simulations tarifaires</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prenom">Prénom</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                className="form-control"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Jean"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="nom">Nom</label>
              <input
                type="text"
                id="nom"
                name="nom"
                className="form-control"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Dupont"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Mot de passe *</label>
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
              <small className="form-hint">
                Min. 6 caractères avec au moins 1 chiffre
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="entreprise">Entreprise</label>
              <input
                type="text"
                id="entreprise"
                name="entreprise"
                className="form-control"
                value={formData.entreprise}
                onChange={handleChange}
                placeholder="ALIZ STRATEGY"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="telephone">Téléphone</label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                className="form-control"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="+225 XX XX XX XX XX"
                disabled={loading}
              />
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
                Création en cours...
              </>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Déjà un compte ?{' '}
            <Link to="/login" className="auth-link">
              Se connecter
            </Link>
          </p>
        </div>

        <div className="auth-terms">
          <p>
            En créant un compte, vous acceptez nos conditions d'utilisation
            et notre politique de confidentialité.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;