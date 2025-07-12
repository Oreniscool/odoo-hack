import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SignInButton, useClerk, useUser } from '@clerk/clerk-react';
import { PenTool, Home, User, LogOut, Settings } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/');
    }
  };

  return (
    <nav className="bg-white border-b border-primary-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-3 text-xl font-semibold text-primary-900 hover:text-accent-600 transition-colors"
            >
              <PenTool className="h-7 w-7 text-accent-600" />
              <span>BlogHub</span>
            </Link>
          </div>

          <div className="flex items-center space-x-1">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-accent-50 text-accent-700 border border-accent-200' 
                  : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>

            {/* Admin Navigation */}
            {isSignedIn && user?.publicMetadata?.role === "admin" && (
              <>
                <Link
                  to="/admin"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/admin') 
                      ? 'bg-accent-50 text-accent-700 border border-accent-200' 
                      : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
                
                <Link
                  to="/create"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/create') 
                      ? 'bg-accent-50 text-accent-700 border border-accent-200' 
                      : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'
                  }`}
                >
                  <PenTool className="h-4 w-4" />
                  <span>Create Post</span>
                </Link>
              </>
            )}

            {/* User Navigation */}
            {isSignedIn && user?.publicMetadata?.role !== "admin" && (
              <>
                <Link
                  to="/user"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/user') 
                      ? 'bg-accent-50 text-accent-700 border border-accent-200' 
                      : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                
                <Link
                  to="/create"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/create') 
                      ? 'bg-accent-50 text-accent-700 border border-accent-200' 
                      : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'
                  }`}
                >
                  <PenTool className="h-4 w-4" />
                  <span>Create Post</span>
                </Link>
              </>
            )}

            {/* User Profile and Sign Out */}
            {isSignedIn && (
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-primary-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-accent-100 flex items-center justify-center">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-accent-600" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary-900">
                      {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                    </span>
                    {user?.publicMetadata?.role === "admin" && (
                      <span className="text-xs text-accent-600 font-medium">Admin</span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-primary-600 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            {/* Sign In Button */}
            {!isSignedIn && (
              <SignInButton mode="modal">
                <button className="flex items-center space-x-2 px-4 py-2 bg-accent-600 text-white rounded-lg font-medium hover:bg-accent-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2">
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;