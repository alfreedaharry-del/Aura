import { create } from 'zustand';
import { Track, Playlist } from '../types';
import { dbStore } from '../lib/db';
import { MusicLibraryService } from '../lib/MusicLibraryService';
import { preloadCoverBatch } from '../lib/coverArt';

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
      set({ tracks: songs, directories, playlists, status: 'ready', isScanning: false });

      const existingTracks = await dbStore.getAllTracks();
      const existingMap = new Map(existingTracks.map(t => [t.id, t]));

      const mergedTracks = songs.map(track => {
        const existing = existingMap.get(track.id);
        if (existing) {
          return {
            ...track,
            playCount: existing.playCount || 0,
            lastPlayed: existing.lastPlayed,
            dateAdded: existing.dateAdded || track.dateAdded,
            isFavorite: existing.isFavorite || false,
            customOrder: existing.customOrder || 0
          };
        }
        return track;
      });

      await dbStore.clearTracks();
      await dbStore.saveTracks(mergedTracks);
      set({ tracks: mergedTracks, playlists });
      preloadCoverBatch(mergedTracks.slice(0, 12));
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
      dbStore.saveTrack(track);
      set({ tracks });
    }
  },

  toggleFavorite: (trackId) => {
    const tracks = [...get().tracks];
    const trackIndex = tracks.findIndex(t => t.id === trackId);
    if (trackIndex !== -1) {
      const track = { ...tracks[trackIndex], isFavorite: !tracks[trackIndex].isFavorite };
      
      // If newly favorited, append to customOrder
      if (track.isFavorite) {
        const maxOrder = Math.max(0, ...tracks.filter(t => t.isFavorite).map(t => t.customOrder || 0));
        track.customOrder = maxOrder + 1;
      }
      
      tracks[trackIndex] = track;
      dbStore.saveTrack(track);
      set({ tracks });
    }
  },

  reorderFavorites: (newOrderIds: string[]) => {
    const tracks = [...get().tracks];
    newOrderIds.forEach((id, index) => {
      const trackIndex = tracks.findIndex(t => t.id === id);
      if (trackIndex !== -1) {
        tracks[trackIndex] = { ...tracks[trackIndex], customOrder: index };
        dbStore.saveTrack(tracks[trackIndex]);
      }
    });
    set({ tracks });
  }
}));
