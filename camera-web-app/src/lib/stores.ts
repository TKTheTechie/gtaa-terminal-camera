import { writable } from 'svelte/store';
import type { User } from './types';

export const currentUser = writable<User | null>(null);
export const isAuthenticated = writable<boolean>(false);

// Track which camera is currently active (default: aircanada)
export const activeCamera = writable<string>('aircanada');