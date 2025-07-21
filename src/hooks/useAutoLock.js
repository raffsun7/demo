import { useEffect, useRef, useState } from 'react';
import { logOut } from '../services/firebase';

const useAutoLock = (timeoutMinutes = 10) => {
  const [isLocked, setIsLocked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeoutMinutes * 60);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    setTimeRemaining(timeoutMinutes * 60);
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      lockVault();
    }, timeoutMinutes * 60 * 1000);
    
    // Update countdown every second
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, (timeoutMinutes * 60) - elapsed);
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
      }
    }, 1000);
  };

  const lockVault = async () => {
    setIsLocked(true);
    await logOut();
    
    // Clear timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Show lock message
    const lockMessage = document.createElement('div');
    lockMessage.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: #f5f5f5;
        font-family: 'Inter', sans-serif;
        text-align: center;
      ">
        <div style="
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 3rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          animation: fadeIn 1s ease-out;
        ">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🔒</div>
          <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color: #e94560;">Vault Locked</h2>
          <p style="color: #a0a0a0; font-style: italic;">
            "Your memories rest safely in the shadows..."
          </p>
          <p style="margin-top: 1rem; font-size: 0.9rem;">
            Please refresh the page to return to the vault.
          </p>
        </div>
      </div>
      <style>
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
    `;
    document.body.appendChild(lockMessage);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (!isLocked) {
        resetTimer();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLocked, timeoutMinutes]);

  return {
    isLocked,
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    resetTimer,
    lockVault
  };
};

export default useAutoLock;

