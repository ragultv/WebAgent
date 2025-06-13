import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthContainer from './components/Auth/AuthContainer';
import useAuth from './components/Auth/useAuth';
import HomePage from './pages/Home';
import UserProfilePage from './pages/UserProfilePage';
import './App.css';

function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="loading-app-container">
        <div className="spinner"></div>
        <p>Loading WebAgent...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? (
              <AuthContainer onAuthSuccess={() => window.location.href = '/'} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <HomePage />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/profile" 
          element={
            isAuthenticated ? (
              <UserProfilePage />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;