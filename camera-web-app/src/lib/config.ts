import type { User, AppConfig } from './types';

export const USERS: User[] = [
  { username: 'aircanada', password: 'aircanada' },
  { username: 'lufthansa', password: 'lufthansa' },
  { username: 'westjet', password: 'westjet' },
  { username: 'admin', password: 'admin', isAdmin: true }
];

export const APP_CONFIG: AppConfig = {
  videoFeedTopic: import.meta.env.VITE_VIDEO_FEED_TOPIC || 'gtaa/camera/feed',
  videoFeedControlTopic: import.meta.env.VITE_VIDEO_FEED_CONTROL_TOPIC || 'gtaa/camera/control',
  solace: {
    url: import.meta.env.VITE_SOLACE_URL || 'ws://localhost:8008',
    vpnName: import.meta.env.VITE_SOLACE_VPN || 'default',
    username: import.meta.env.VITE_SOLACE_USERNAME || 'default',
    password: import.meta.env.VITE_SOLACE_PASSWORD || 'default'
  }
};

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Debug logging
if (typeof window !== 'undefined') {
  console.log('=== GTAA Camera App Configuration ===');
  console.log('DEMO_MODE:', DEMO_MODE);
  console.log('VITE_DEMO_MODE env:', import.meta.env.VITE_DEMO_MODE);
  console.log('Solace Config:', APP_CONFIG.solace);
  console.log('====================================');
}