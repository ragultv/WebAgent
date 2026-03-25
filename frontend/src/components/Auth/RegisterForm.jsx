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
    <div className="bg-google-surface rounded-3xl p-8 md:p-12 w-full shadow-2xl border border-google-border">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-google-dark border border-google-border mb-4">
          <svg className="w-6 h-6 text-google-primary" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-2xl font-normal text-google-text">Create Account</h2>
        <p className="mt-2 text-sm text-google-text-secondary">to get started with WebAgent</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-200 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="relative group">
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="peer w-full px-4 py-3 bg-google-dark border border-google-border rounded text-google-text placeholder-transparent focus:outline-none focus:border-google-primary focus:ring-1 focus:ring-google-primary transition-colors"
                placeholder="Username"
              />
              <label
                htmlFor="name"
                className="absolute left-4 -top-2.5 bg-google-dark px-1 text-xs text-google-text-secondary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-google-text-secondary peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-google-primary"
              >
                Username
              </label>
            </div>
          </div>

          <div>
            <div className="relative group">
              <input
                id="api_key"
                name="api_key"
                type="text"
                required
                value={formData.api_key}
                onChange={handleChange}
                className="peer w-full px-4 py-3 bg-google-dark border border-google-border rounded text-google-text placeholder-transparent focus:outline-none focus:border-google-primary focus:ring-1 focus:ring-google-primary transition-colors"
                placeholder="API Key"
              />
              <label
                htmlFor="api_key"
                className="absolute left-4 -top-2.5 bg-google-dark px-1 text-xs text-google-text-secondary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-google-text-secondary peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-google-primary"
              >
                API Key
              </label>
            </div>
            <p className="mt-1 text-xs text-google-text-secondary ml-1">
              Get your API key from{' '}
              <a
                href="https://build.nvidia.com/settings/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-google-primary hover:text-google-primary-hover underline"
              >
                build.nvidia.com
              </a>
            </p>
          </div>

          <div>
            <div className="relative group">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                className="peer w-full px-4 py-3 bg-google-dark border border-google-border rounded text-google-text placeholder-transparent focus:outline-none focus:border-google-primary focus:ring-1 focus:ring-google-primary transition-colors"
                placeholder="Create a password"
              />
              <label
                htmlFor="password"
                className="absolute left-4 -top-2.5 bg-google-dark px-1 text-xs text-google-text-secondary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-google-text-secondary peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-google-primary"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-google-text-secondary hover:text-google-text focus:outline-none text-sm font-medium"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <div className="relative group">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`peer w-full px-4 py-3 bg-google-dark border rounded text-google-text placeholder-transparent focus:outline-none focus:ring-1 transition-colors ${!passwordMatch ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-google-border focus:border-google-primary focus:ring-google-primary'
                  }`}
                placeholder="Confirm password"
              />
              <label
                htmlFor="confirmPassword"
                className={`absolute left-4 -top-2.5 bg-google-dark px-1 text-xs transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs ${!passwordMatch ? 'text-red-400 peer-placeholder-shown:text-red-400 peer-focus:text-red-400' : 'text-google-text-secondary peer-placeholder-shown:text-google-text-secondary peer-focus:text-google-primary'
                  }`}
              >
                Confirm
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-3.5 text-google-text-secondary hover:text-google-text focus:outline-none text-sm font-medium"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {!passwordMatch && (
              <p className="mt-1 text-xs text-red-400 ml-1">Passwords do not match</p>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-between items-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm font-medium text-google-primary hover:text-google-primary-hover transition-colors"
          >
            Sign in instead
          </button>

          <button
            type="submit"
            disabled={isLoading || !passwordMatch}
            className="inline-flex justify-center items-center py-2 px-6 border border-transparent text-sm font-medium rounded-full text-google-dark bg-google-primary hover:bg-google-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-google-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-google-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
