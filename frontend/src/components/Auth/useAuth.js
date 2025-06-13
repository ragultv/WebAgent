import { useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser, refreshToken as apiRefreshToken } from '../../services/api';

// Auth context to manage authentication state
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      logout();
      return false;
    }
    try {
      const response = await apiRefreshToken({ refresh_token: refreshToken });
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token); // Refresh token might also be new
      setToken(response.access_token);
      setRefreshToken(response.refresh_token);
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      return false;
    }
  };

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = async () => {
      if (token) {
        try {
          setIsLoading(true);
          const userData = await getCurrentUser(token);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.warn('Access token invalid or expired, attempting refresh...');
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            // After successful refresh, try to get user data again with the new token
            try {
              const newUserData = await getCurrentUser(localStorage.getItem('access_token'));
              setUser(newUserData);
              setIsAuthenticated(true);
            } catch (retryError) {
              console.error('Failed to get user after token refresh:', retryError);
              logout();
            }
          } else {
            logout(); // Refresh failed, so log out
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false); // No token, so not loading auth
      }
    };

    checkAuth();
  }, [token, refreshToken]); // Depend on refreshToken as well

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await loginUser(credentials);
      
      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      
      setToken(response.access_token);
      setRefreshToken(response.refresh_token);
      
      // Fetch user data
      const userData = await getCurrentUser(response.access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await registerUser(userData);
      
      // After successful registration, automatically log in
      const loginResult = await login({
        username: userData.name,
        password: userData.password
      });
      
      return loginResult;
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout
  };
};

export default useAuth;
