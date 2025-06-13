import useAuth from './useAuth';

const UserProfile = () => {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse h-8 w-8 bg-gray-300 rounded-full"></div>
        <div className="animate-pulse h-4 w-20 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {user.name}
        </span>
      </div>
      
      <button
        onClick={logout}
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
};

export default UserProfile;
