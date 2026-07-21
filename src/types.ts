export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: number;
  genre?: string;
  duration: number;
  trackNumber?: number;
  coverUrl?: string;
  filePath: string;
  dateAdded: number;
  playCount: number;
  lastPlayed?: number;
  fileHandle?: any; // FileSystemFileHandle
  fileSize?: number;
  fileType?: string;
  isFavorite?: boolean;
  customOrder?: number;
  parentPath?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

export interface CustomTheme {
  id: string;
  name: string;
  backgroundColor: string; // --bg-base
  primaryColor: string; // --bg-panel
  accentColor: string; // --accent
  accentHoverColor?: string; // --accent-hover
  surfaceColor: string; // --bg-elevated
  primaryTextColor: string; // --text-primary
  secondaryTextColor: string; // --text-secondary
  iconColor?: string; // Icon tint
  borderColor: string; // --border
  glassTintColor: string; // --glass-bg
  gradientColor?: string; // --gradient-color (optional override)
  isPreset?: boolean;
  createdAt?: number;
}

export type Theme = string;

export type EqPreset = 'flat' | 'bass-boost' | 'treble-boost' | 'rock' | 'pop' | 'jazz' | 'classical' | 'electronic' | 'acoustic' | 'custom';

export type ReverbPreset = 'none' | 'small-room' | 'medium-room' | 'concert-hall' | 'cathedral' | 'studio' | 'ambient';

export interface AppSettings {
  theme: Theme;
  musicFolderHandle: any | null; // FileSystemDirectoryHandle
  volume: number;
  eqPreset: EqPreset;
  reverbPreset: ReverbPreset;
  eqBands: number[]; // e.g. 10 bands
  playbackSpeed: number;
  crossfade: boolean;
  crossfadeDuration: number;
  lastScanTime: number;
  autoMonitor: boolean;
  isSidebarExpanded: boolean;
}
