import { create } from 'zustand';
import { Track, Playlist } from '../types';
import { dbStore } from '../lib/db';
import { MusicLibraryService } from '../lib/MusicLibraryService';
import { preloadCoverBatch } from '../lib/coverArt';

let autoRefreshTimer: number | null = null;

export type LibraryStatus = 'initializing' | 'ready';

interface LibraryState {
  tracks: Track[];
  directories: string[];
  playlists: Playlist[];
  isScanning: boolean;
  status: LibraryStatus;
  loadLibrary: () => Promise<void>;
  updateTrackPlayCount: (trackId: string) => void;
  toggleFavorite: (trackId: string) => void;
  reorderFavorites: (newOrderIds: string[]) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  directories: [],
  playlists: [],
  isScanning: false,
  status: 'initializing',

  loadLibrary: async () => {
    set({ isScanning: true });
    try {
      const { songs, directories } = await MusicLibraryService.loadFixedLibrary();
      const playlists = await dbStore.getAllPlaylists();
      const normalizedPlaylists = playlists.map(playlist => ({
        ...playlist,
        trackIds: playlist.trackIds.filter(trackId => songs.some(track => track.id === trackId)),
      }));

      set({ tracks: songs, directories, playlists: normalizedPlaylists, status: 'ready', isScanning: false });
      preloadCoverBatch(songs.slice(0, 12));

      if (typeof window !== 'undefined' && autoRefreshTimer === null) {
        autoRefreshTimer = window.setInterval(() => {
          void get().loadLibrary();
        }, 5000);
      }
    } catch (e) {
      console.error("Failed to load fixed library", e);
      set({ status: 'ready', isScanning: false });
    }
  },

  updateTrackPlayCount: (trackId) => {
    const tracks = [...get().tracks];
    const trackIndex = tracks.findIndex(t => t.id === trackId);
    if (trackIndex !== -1) {
      const track = { ...tracks[trackIndex], playCount: tracks[trackIndex].playCount + 1, lastPlayed: Date.now() };
      tracks[trackIndex] = track;
      set({ tracks });
    }
  },

  toggleFavorite: (trackId) => {
    const tracks = [...get().tracks];
    const trackIndex = tracks.findIndex(t => t.id === trackId);
    if (trackIndex !== -1) {
      const track = { ...tracks[trackIndex], isFavorite: !tracks[trackIndex].isFavorite };
      
      if (track.isFavorite) {
        const maxOrder = Math.max(0, ...tracks.filter(t => t.isFavorite).map(t => t.customOrder || 0));
        track.customOrder = maxOrder + 1;
      }
      
      tracks[trackIndex] = track;
      set({ tracks });
    }
  },

  reorderFavorites: (newOrderIds: string[]) => {
    const tracks = [...get().tracks];
    newOrderIds.forEach((id, index) => {
      const trackIndex = tracks.findIndex(t => t.id === id);
      if (trackIndex !== -1) {
        tracks[trackIndex] = { ...tracks[trackIndex], customOrder: index };
      }
    });
    set({ tracks });
  }
}));
