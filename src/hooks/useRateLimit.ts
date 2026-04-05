import { useState, useEffect } from 'react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useRateLimit = (actionIdentifier: string) => {
  const getKey = () => `rate_limit_${actionIdentifier}`;

  const [attempts, setAttempts] = useState(() => {
    const stored = localStorage.getItem(getKey());
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return { count: 0, lockoutUntil: null };
      }
    }
    return { count: 0, lockoutUntil: null };
  });

  useEffect(() => {
    localStorage.setItem(getKey(), JSON.stringify(attempts));
  }, [attempts, actionIdentifier]);

  const isLockedOut = () => {
    if (!attempts.lockoutUntil) return false;
    if (Date.now() > attempts.lockoutUntil) {
      // Lockout expired - reset count to allow a fresh start
      setAttempts({ count: 0, lockoutUntil: null });
      return false;
    }
    return true;
  };

  const getLockoutRemainingTime = () => {
    if (!attempts.lockoutUntil) return "";
    const remainingMs = attempts.lockoutUntil - Date.now();
    if (remainingMs <= 0) return "";

    const totalMinutes = Math.ceil(remainingMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const recordAttempt = () => {
    const newCount = (attempts.count || 0) + 1;
    if (newCount >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      setAttempts({
        count: newCount,
        lockoutUntil: lockoutUntil,
      });
      return true; // Just locked out
    } else {
      setAttempts({
        ...attempts,
        count: newCount,
      });
      return false;
    }
  };

  const resetAttempts = () => {
    setAttempts({ count: 0, lockoutUntil: null });
  };

  return {
    isLockedOut: isLockedOut(),
    remainingTime: getLockoutRemainingTime(),
    recordAttempt,
    resetAttempts,
    attemptsCount: attempts.count || 0,
    maxAttempts: MAX_ATTEMPTS
  };
};
