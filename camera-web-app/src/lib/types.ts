export interface User {
  username: string;
  password: string;
  isAdmin?: boolean;
}

export interface VideoFrame {
  frameId: string;
  totalChunks: number;
  frameSize: number;
  timestamp: string;
  type: 'frame_start' | 'frame_chunk' | 'frame_end';
  chunkIndex?: number;
  data?: string;
}

export interface SolaceConfig {
  url: string;
  vpnName: string;
  username: string;
  password: string;
}

export interface AppConfig {
  videoFeedTopic: string;
  videoFeedControlTopic: string;
  solace: SolaceConfig;
}