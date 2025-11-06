import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// Pages et composants (à créer)
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Simulator from './components/Simulator';
import SimulatorEnhanced from './components/SimulatorEnhanced';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';

// Services
import authService from './services/authService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    navigate('/simulator-enhanced');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Routes publiques */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/simulator-enhanced" /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/register"
          element={
            user ? <Navigate to="/simulator-enhanced" /> : <Register onRegister={handleLogin} />
          }
        />
        <Route
          path="/forgot-password"
          element={
            user ? <Navigate to="/simulator-enhanced" /> : <ForgotPassword />
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            user ? <Navigate to="/simulator-enhanced" /> : <ResetPassword onLogin={handleLogin} />
          }
        />

        {/* Routes protégées */}
        <Route
          path="/simulator"
          element={
            <PrivateRoute user={user}>
              <Simulator user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/simulator-enhanced"
          element={
            <PrivateRoute user={user}>
              <SimulatorEnhanced user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute user={user}>
              <Dashboard user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />

        {/* Redirection par défaut */}
        <Route
          path="/"
          element={<Navigate to={user ? "/simulator-enhanced" : "/login"} />}
        />
        <Route
          path="*"
          element={<Navigate to={user ? "/simulator-enhanced" : "/login"} />}
        />
      </Routes>
    </div>
  );
}

export default App;