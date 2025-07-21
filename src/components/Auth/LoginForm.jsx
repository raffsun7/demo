import React, { useState, useEffect } from 'react';
import { signIn } from '../../services/firebase';
import { Key, Lock, Eye, EyeOff } from 'lucide-react';

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn(email, password);
    
    if (result.success) {
      // Store email for encryption key derivation
      localStorage.setItem('userEmail', email);
      onLogin(result.user);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Ambient cursor effect */}
      <div className="ambient-cursor" id="ambient-cursor"></div>
      
      <div className={`vault-container p-8 w-full max-w-md transition-all duration-1000 ${
        mounted ? 'vault-unlock' : 'opacity-0'
      }`}>
        {/* Floating key icon */}
        <div className="text-center mb-8">
          <div className="floating inline-block">
            <Key className="w-16 h-16 text-[var(--vault-accent)] mx-auto mb-4" />
          </div>
          <h1 className="text-2xl font-light text-[var(--vault-text)] mb-2">
            Private Gallery Vault
          </h1>
          <p className="text-[var(--vault-text-muted)] text-sm italic">
            "{getGreeting()}. You know the key."
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email field */}
          <div className="space-y-2">
            <label className="text-[var(--vault-text)] text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-rgba(255,255,255,0.05) border border-rgba(255,255,255,0.1) 
                         rounded-lg text-[var(--vault-text)] placeholder-[var(--vault-text-muted)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--vault-accent)] focus:border-transparent
                         transition-all duration-300"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label className="text-[var(--vault-text)] text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-rgba(255,255,255,0.05) border border-rgba(255,255,255,0.1) 
                         rounded-lg text-[var(--vault-text)] placeholder-[var(--vault-text-muted)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--vault-accent)] focus:border-transparent
                         transition-all duration-300"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--vault-text-muted)]
                         hover:text-[var(--vault-accent)] transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[var(--vault-accent)] to-[var(--vault-accent-soft)]
                     text-white font-medium rounded-lg transition-all duration-300
                     hover:shadow-lg hover:shadow-[var(--vault-glow)] hover:scale-[1.02]
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Unlocking vault...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Enter Vault</span>
              </>
            )}
          </button>
        </form>

        {/* Poetic footer */}
        <div className="mt-8 text-center">
          <p className="text-[var(--vault-text-muted)] text-xs italic">
            "Every memory. Every heartbeat. Protected." 🗝️❤️
          </p>
        </div>
      </div>
    </div>
  );
};

// Add cursor tracking effect
if (typeof window !== 'undefined') {
  document.addEventListener('mousemove', (e) => {
    const cursor = document.getElementById('ambient-cursor');
    if (cursor) {
      cursor.style.left = e.clientX - 100 + 'px';
      cursor.style.top = e.clientY - 100 + 'px';
      cursor.style.opacity = '1';
    }
  });

  document.addEventListener('mouseleave', () => {
    const cursor = document.getElementById('ambient-cursor');
    if (cursor) {
      cursor.style.opacity = '0';
    }
  });
}

export default LoginForm;

