import { useState } from 'react';

const RegisterForm = ({ onRegister, isLoading, error, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    api_key: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordMatch(false);
      return;
    }
    
    setPasswordMatch(true);
    const { confirmPassword, ...registrationData } = formData;
    onRegister(registrationData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Check password match in real-time
    if (name === 'confirmPassword' || name === 'password') {
      if (name === 'confirmPassword') {
        setPasswordMatch(formData.password === value);
      } else {
        setPasswordMatch(formData.confirmPassword === value || formData.confirmPassword === '');
      }
    }
  };

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
          <h2 className="mt-6 text-3xl font-extrabold text-white">Create Account</h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-500 text-white p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Username</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-200"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label htmlFor="api_key" className="block text-sm font-medium text-gray-300">API Key</label>
            <input
                id="api_key"
                name="api_key"
                type="text"
                required
                value={formData.api_key}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-200"
                placeholder="Enter your API key"
            />
            <p className="mt-1 text-xs text-gray-400">
                Used to access AI services. Get your API key from{' '}
                <a
                href="https://build.nvidia.com/settings/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
                >
                https://build.nvidia.com/settings/api-keys
                </a>
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-200"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-blue-400 hover:text-blue-300 focus:outline-none"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirm Password</label>
            <div className="mt-1 relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-200 ${
                  !passwordMatch ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-blue-400 hover:text-blue-300 focus:outline-none"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {!passwordMatch && (
              <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !passwordMatch}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </div>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
