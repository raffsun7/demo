import React, { useState } from 'react';
import { Upload, LogOut, Key, Clock, Settings } from 'lucide-react';
import { logOut } from '../../services/firebase';

const Header = ({ user, onUploadClick, timeRemaining, formattedTime }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    const result = await logOut();
    if (result.success) {
      localStorage.removeItem('userEmail');
      window.location.reload();
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.email?.split('@')[0] || 'friend';
    
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 300) return 'text-green-400'; // > 5 minutes
    if (timeRemaining > 120) return 'text-yellow-400'; // > 2 minutes
    return 'text-red-400'; // < 2 minutes
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--vault-primary)]/90 backdrop-blur-md border-b border-white/10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and greeting */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Key className="w-8 h-8 text-[var(--vault-accent)]" />
              <div>
                <h1 className="text-xl font-semibold text-[var(--vault-text)]">
                  Private Gallery Vault
                </h1>
                <p className="text-sm text-[var(--vault-text-muted)] italic">
                  {getGreeting()}. Your gallery is waiting.
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Actions and timer */}
          <div className="flex items-center space-x-4">
            {/* Auto-lock timer */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-white/5 rounded-lg">
              <Clock className={`w-4 h-4 ${getTimeColor()}`} />
              <span className={`text-sm font-mono ${getTimeColor()}`}>
                {formattedTime}
              </span>
              <span className="text-xs text-[var(--vault-text-muted)]">
                until lock
              </span>
            </div>

            {/* Upload button */}
            <button
              onClick={onUploadClick}
              className="flex items-center space-x-2 px-4 py-2 bg-[var(--vault-accent)] text-white rounded-lg hover:bg-[var(--vault-accent-soft)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--vault-glow)]"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 bg-white/10 text-[var(--vault-text)] rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="w-8 h-8 bg-[var(--vault-accent)] rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm">
                  {user?.email?.split('@')[0]}
                </span>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--vault-secondary)] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm text-[var(--vault-text)] font-medium">
                      {user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-[var(--vault-text-muted)]">
                      {user?.email}
                    </p>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Add settings functionality here
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--vault-text)] hover:bg-white/10 transition-colors flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

