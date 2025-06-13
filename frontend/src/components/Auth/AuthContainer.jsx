import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import useAuth from './useAuth';

const AuthContainer = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [error, setError] = useState(null);
  const { login, register, isLoading } = useAuth();

  const handleLogin = async (credentials) => {
    setError(null);
    const result = await login(credentials);
    
    if (result.success) {
      onAuthSuccess?.();
    } else {
      setError(result.error);
    }
  };

  const handleRegister = async (userData) => {
    setError(null);
    const result = await register(userData);
    
    if (result.success) {
      onAuthSuccess?.();
    } else {
      setError(result.error);
    }
  };

  const switchToRegister = () => {
    setAuthMode('register');
    setError(null);
  };

  const switchToLogin = () => {
    setAuthMode('login');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md">
        {authMode === 'login' ? (
          <LoginForm
            onLogin={handleLogin}
            isLoading={isLoading}
            error={error}
            onSwitchToRegister={switchToRegister}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            isLoading={isLoading}
            error={error}
            onSwitchToLogin={switchToLogin}
          />
        )}
      </div>
    </div>
  );
};

export default AuthContainer;
