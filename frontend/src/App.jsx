import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import AuthContainer from './components/Auth/AuthContainer';
import useAuth from './components/Auth/useAuth';
import HomePage from './pages/Home';
import UserProfilePage from './pages/UserProfilePage';

function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-google-dark flex flex-col items-center justify-center text-google-text">
        <Loader className="w-8 h-8 animate-spin text-google-primary mb-4" />
        <p className="text-sm font-medium">Loading WebAgent...</p>
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