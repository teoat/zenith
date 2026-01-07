import { useState, useEffect } from 'react';
import { electronStore } from '@/utils/electronStore';
import { secureLogger } from '@/utils/secureLogger';

/**
 * A custom hook to persist state to localStorage (and Electron store if available).
 * @param key The key to store the value under.
 * @param initialValue The initial value if no stored value exists.
 * @returns [storedValue, setValue]
 */
export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Load initial value from store
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const item = await electronStore.get<T>(key, initialValue);
        setStoredValue(item ?? initialValue);
      } catch (error) {
        secureLogger.warn(`Error reading persisted key "${key}":`, error);
      }
    };
    loadPersistedState();
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to the store.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to store (handles both localStorage and Electron)
      electronStore.set(key, valueToStore).catch((error) => {
        secureLogger.warn(`Error persisting key "${key}":`, error);
      });
    } catch (error) {
      secureLogger.warn(`Error setting persisted value for key "${key}":`, error);
    }
  };

  useEffect(() => {
    // Sync with other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          secureLogger.error(`Error parsing storage change for key "${key}":`, error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
