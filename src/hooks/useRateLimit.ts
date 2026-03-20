import { useState, useEffect } from 'react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const useRateLimit = (actionIdentifier: string) => {
  const getKey = () => `rate_limit_${actionIdentifier}`;

  const [attempts, setAttempts] = useState(() => {
    const stored = localStorage.getItem(getKey());
    if (stored) {
      return JSON.parse(stored);
    }
    return { count: 0, lockoutUntil: null };
  });

  useEffect(() => {
    localStorage.setItem(getKey(), JSON.stringify(attempts));
  }, [attempts, actionIdentifier]);

  const isLockedOut = () => {
    if (!attempts.lockoutUntil) return false;
    if (Date.now() > attempts.lockoutUntil) {
      // Lockout expired, reset
      setAttempts({ count: 0, lockoutUntil: null });
      return false;
    }
    return true;
  };

  const getLockoutRemainingMinutes = () => {
    if (!attempts.lockoutUntil) return 0;
    const remainingMs = attempts.lockoutUntil - Date.now();
    return Math.ceil(remainingMs / 60000);
  };

  const recordAttempt = () => {
    const newCount = attempts.count + 1;
    if (newCount >= MAX_ATTEMPTS) {
      setAttempts({
        count: newCount,
        lockoutUntil: Date.now() + LOCKOUT_DURATION_MS,
      });
    } else {
      setAttempts({
        ...attempts,
        count: newCount,
      });
    }
  };

  const resetAttempts = () => {
    setAttempts({ count: 0, lockoutUntil: null });
  };

  return {
    isLockedOut: isLockedOut(),
    remainingMinutes: getLockoutRemainingMinutes(),
    recordAttempt,
    resetAttempts,
  };
};
