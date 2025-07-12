import React, { useState } from 'react';
import { Menu, X, Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  isGuestMode?: boolean;
  onExploreClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isGuestMode = false, onExploreClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/90 backdrop-blur-glass border-b border-gray-200/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              StackIt
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isGuestMode ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="relative">
                  <Bell className="w-6 h-6 text-gray-600 hover:text-purple-600 cursor-pointer transition-colors" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-error rounded-full flex items-center justify-center text-xs text-white">
                    3
                  </span>
                </div>
                <button className="bg-gradient-secondary text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200">
                  Sign In
                </button>
              </>
            ) : (
              <>
                <a href="#features" className="text-gray-700 hover:text-purple-600 transition-colors">
                  Features
                </a>
                <button
                  onClick={onExploreClick}
                  className="text-purple-600 hover:text-purple-800 transition-colors font-medium"
                >
                  Explore
                </button>
                <button className="bg-gradient-primary text-white px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 transform hover:scale-105">
                  Get Started
                </button>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-purple-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-sm rounded-lg mt-2 border border-gray-200/20">
              {!isGuestMode && (
                <>
                  <a href="#features" className="block px-3 py-2 text-gray-700 hover:text-purple-600 transition-colors">
                    Features
                  </a>
                  <button
                    onClick={onExploreClick}
                    className="block w-full text-left px-3 py-2 text-purple-600 hover:text-purple-800 transition-colors font-medium"
                  >
                    Explore
                  </button>
                  <button className="w-full mt-2 bg-gradient-primary text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200">
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;