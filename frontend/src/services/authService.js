import axios from 'axios';

const API_URL = '/api/auth';

// Configuration par défaut d'axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Ajouter le token à toutes les requêtes si disponible
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Gérer les erreurs d'authentification globalement
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class AuthService {
  // Inscription
  async register(userData) {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Connexion
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Déconnexion
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return axios.post(`${API_URL}/logout`).catch(() => {
      // Même si la déconnexion échoue côté serveur, on déconnecte localement
    });
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Obtenir le token
  getToken() {
    return localStorage.getItem('token');
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return !!this.getToken();
  }

  // Obtenir le profil utilisateur
  async getProfile() {
    try {
      const response = await axios.get(`${API_URL}/me`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Mettre à jour le profil
  async updateProfile(profileData) {
    try {
      const response = await axios.put(`${API_URL}/updateprofile`, profileData);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Changer le mot de passe
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await axios.put(`${API_URL}/changepassword`, {
        currentPassword,
        newPassword
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Demander une réinitialisation de mot de passe
  async forgotPassword(email) {
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Vérifier le token de réinitialisation
  async verifyResetToken(token) {
    try {
      const response = await axios.get(`${API_URL}/reset-password/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Réinitialiser le mot de passe
  async resetPassword(token, password) {
    try {
      const response = await axios.post(`${API_URL}/reset-password/${token}`, { password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new AuthService();