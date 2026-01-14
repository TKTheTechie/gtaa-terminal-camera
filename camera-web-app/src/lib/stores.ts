import { writable } from 'svelte/store';
import type { User } from './types';

// Helper to create a persisted store
function createPersistedStore<T>(key: string, initialValue: T) {
  // Check if we're in the browser
  const isBrowser = typeof window !== 'undefined';
  
  // Get initial value from localStorage if available
  const stored = isBrowser ? localStorage.getItem(key) : null;
  const initial = stored ? JSON.parse(stored) : initialValue;
  
  const store = writable<T>(initial);
  
  // Subscribe to changes and persist to localStorage
  if (isBrowser) {
    store.subscribe(value => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }
  
  return store;
}

export const currentUser = createPersistedStore<User | null>('gtaa_currentUser', null);
export const isAuthenticated = createPersistedStore<boolean>('gtaa_isAuthenticated', false);

// Track which camera is currently active (default: aircanada)
export const activeCamera = writable<string>('aircanada');