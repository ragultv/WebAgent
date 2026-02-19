import React, { useState, useEffect } from 'react';
import useAuth from '../components/Auth/useAuth';
import { updateApiKey } from '../services/api'; // Ensure this import is correct based on your API service structure
import { useNavigate } from 'react-router-dom';
import { Loader, ArrowLeft, Key, LogOut, User } from 'lucide-react';

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

    // Mock implementation if updateApiKey is not available, or replace with actual call
    // verification: updateApiKey import exists in original file, assuming it works.

    if (!newApiKey || !currentPassword) {
      setError('Please fill in both new API key and current password fields.');
      setIsUpdating(false);
      return;
    }

    try {
      // Assuming updateApiKey takes an object { new_api_key, current_password }
      // If the original file had this, we keep it. 
      // Note: original file had `updateApiKey({ new_api_key: newApiKey, current_password: currentPassword })`
      // We will assume the service function signature matches.

      const result = await updateApiKey({ new_api_key: newApiKey, current_password: currentPassword });

      if (result && result.success) {
        setMessage('API Key updated successfully!');
        setNewApiKey('');
        setCurrentPassword('');
      } else {
        // Handle case where result might be undefined or success is false
        setError(result?.error || 'Failed to update API Key.');
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
      <div className="min-h-screen bg-google-dark flex flex-col items-center justify-center text-google-text">
        <Loader className="w-8 h-8 animate-spin text-google-primary mb-4" />
        <p className="text-sm font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-google-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Please log in to view your profile.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-google-primary text-google-dark rounded-full text-sm font-medium hover:bg-google-primary-hover transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-google-dark flex items-center justify-center p-4">
      <div className="bg-google-surface rounded-3xl p-8 md:p-12 w-full max-w-md border border-google-border shadow-2xl relative">

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 p-2 text-google-text-secondary hover:text-google-text hover:bg-google-surface-hover rounded-full transition-colors"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-8 mt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-google-dark border border-google-border mb-4">
            <User className="w-8 h-8 text-google-primary" />
          </div>
          <h2 className="text-2xl font-normal text-google-text">{user.name}</h2>
          <p className="mt-1 text-sm text-google-text-secondary">{user.email}</p>
        </div>

        {message && (
          <div className="bg-green-900/30 border border-green-800 text-green-200 p-3 rounded-lg text-sm text-center mb-6">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-200 p-3 rounded-lg text-sm text-center mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdateApiKey} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="newApiKey" className="block text-xs font-medium text-google-text-secondary mb-1.5 ml-1">Update API Key</label>
              <div className="relative group">
                <div className="absolute left-3 top-3 text-google-text-secondary group-focus-within:text-google-primary transition-colors">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="newApiKey"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-google-dark border border-google-border rounded-lg text-google-text placeholder-google-text-secondary/50 focus:outline-none focus:border-google-primary focus:ring-1 focus:ring-google-primary transition-colors text-sm"
                  placeholder="Enter new API key"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="currentPassword" className="block text-xs font-medium text-google-text-secondary mb-1.5 ml-1">Confirm Password</label>
              <div className="relative group">
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-google-dark border border-google-border rounded-lg text-google-text placeholder-google-text-secondary/50 focus:outline-none focus:border-google-primary focus:ring-1 focus:ring-google-primary transition-colors text-sm"
                  placeholder="Current password"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-full text-google-dark bg-google-primary hover:bg-google-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-google-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md mt-2"
          >
            {isUpdating ? (
              <>
                <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-google-dark" />
                Updating...
              </>
            ) : (
              'Update API Key'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-google-border flex justify-center">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors px-4 py-2 hover:bg-red-900/10 rounded-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;