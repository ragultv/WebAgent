import React, { useState, useEffect } from 'react';
import useAuth from '../components/Auth/useAuth';
import { updateApiKey } from '../services/api';
import { useNavigate } from 'react-router-dom';

const UserProfilePage = () => {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const [newApiKey, setNewApiKey] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const handleUpdateApiKey = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    setError(null);

    if (!newApiKey || !currentPassword) {
      setError('Please fill in both new API key and current password fields.');
      setIsUpdating(false);
      return;
    }

    try {
      const result = await updateApiKey({ new_api_key: newApiKey, current_password: currentPassword });
      if (result.success) {
        setMessage('API Key updated successfully!');
        setNewApiKey('');
        setCurrentPassword('');
      } else {
        setError(result.error || 'Failed to update API Key.');
      }
    } catch (err) {
      console.error('API Key Update Error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="spinner text-white"></div>
        <p className="text-white ml-4">Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <p className="text-red-500 text-center mt-8">Please log in to view your profile.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-xl shadow-lg z-10">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="text-white">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">WebAgent</h1>
            <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded-full uppercase font-semibold tracking-wide">Beta</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">User Profile</h2>
        </div>

        {user && (
          <div className="mb-6 text-center text-gray-300">
            <p className="text-lg font-medium">Username: {user.name}</p>
            <p className="">Email: {user.email}</p>
          </div>
        )}

        {message && (
          <div className="bg-green-500 text-white p-3 rounded-md text-sm text-center mb-4" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-500 text-white p-3 rounded-md text-sm text-center mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdateApiKey} className="space-y-6">
          <div>
            <label htmlFor="newApiKey" className="block text-sm font-medium text-gray-300">New API Key</label>
            <input
              type="password"
              id="newApiKey"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-200"
              placeholder="Enter your new API key"
              required
            />
          </div>
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-200"
              placeholder="Enter your current password to confirm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isUpdating}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isUpdating ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </div>
            ) : (
              'Update API Key'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={logout}
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;