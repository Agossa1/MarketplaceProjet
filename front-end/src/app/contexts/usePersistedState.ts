'use client'
import { useState, useEffect } from 'react';

function usePersistedState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const persistedValue = localStorage.getItem(key);
      return persistedValue !== null ? JSON.parse(persistedValue) : defaultValue;
    }
    return defaultValue;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);

  return [state, setState];
}

export default usePersistedState;