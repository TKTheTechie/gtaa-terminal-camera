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
  analyticsTopic: import.meta.env.VITE_ANALYTICS_TOPIC || 'gtaa/camera/analytics/gate1',
  solace: {
    url: import.meta.env.VITE_SOLACE_URL || 'ws://localhost:8008',
    vpnName: import.meta.env.VITE_SOLACE_VPN || 'default',
    username: import.meta.env.VITE_SOLACE_USERNAME || 'default',
    password: import.meta.env.VITE_SOLACE_PASSWORD || 'default'
  }
};

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';