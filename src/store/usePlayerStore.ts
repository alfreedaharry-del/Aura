import { create } from 'zustand';
import { Track } from '../types';
import { engine } from '../lib/audioEngine';
import { preloadCoverBatch } from '../lib/coverArt';
import { useSettingsStore } from './useSettingsStore';
import { useLibraryStore } from './useLibraryStore';

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  viewMode: 'vinyl' | 'waveform' | 'minimal';
  nowPlayingOpen: boolean;
  shuffle: boolean;
  repeatMode: 'none' | 'one' | 'all';
  lastPlaylistId: string | null;
  
  playTrack: (track: Track, queue?: Track[], playlistId?: string | null) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setViewMode: (mode: 'vinyl' | 'waveform' | 'minimal') => void;
  setNowPlayingOpen: (open: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeatMode: () => void;
  initPlayer: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Bind engine events
  engine.onTimeUpdate = (time) => {
    set({ currentTime: time });
    const lastSaved = parseFloat(localStorage.getItem('currentTime') || '0');
    if (Math.abs(time - lastSaved) >= 1) {
      localStorage.setItem('currentTime', time.toString());
    }
  };

  engine.onDurationChange = (duration) => {
    set({ duration });
  };

  engine.onEnded = () => {
    get().next();
  };

  // Safe JSON Parsing helper
  const getSavedJSON = <T>(key: string, fallback: T): T => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    currentTrack: getSavedJSON<Track | null>('currentTrack', null),
    queue: getSavedJSON<Track[]>('queue', []),
    queueIndex: parseInt(localStorage.getItem('queueIndex') || '-1', 10),
    isPlaying: false,
    currentTime: parseFloat(localStorage.getItem('currentTime') || '0'),
    duration: getSavedJSON<Track | null>('currentTrack', null)?.duration || 0,
    viewMode: 'minimal',
    nowPlayingOpen: false,
    shuffle: localStorage.getItem('shuffle') === 'true',
    repeatMode: (localStorage.getItem('repeatMode') as 'none' | 'one' | 'all') || 'none',
    lastPlaylistId: localStorage.getItem('lastPlaylistId') || null,

    initPlayer: async () => {
      const libraryTracks = useLibraryStore.getState().tracks;
      const resolvedQueue = get().queue.length > 0 ? get().queue : libraryTracks;
      const normalizedQueue = resolvedQueue
        .map(track => libraryTracks.find(candidate => candidate.id === track.id) || null)
        .filter((track): track is Track => Boolean(track));

      if (normalizedQueue.length > 0) {
        set({ queue: normalizedQueue, queueIndex: get().queueIndex >= 0 && get().queueIndex < normalizedQueue.length ? get().queueIndex : 0 });
        localStorage.setItem('queue', JSON.stringify(normalizedQueue));
      } else {
        set({ queue: [], queueIndex: -1 });
        localStorage.removeItem('queue');
        localStorage.removeItem('queueIndex');
      }

      const currentTrack = get().currentTrack ? libraryTracks.find(candidate => candidate.id === get().currentTrack?.id) || null : null;
      if (currentTrack) {
        set({ currentTrack });
        localStorage.setItem('currentTrack', JSON.stringify(currentTrack));
      } else {
        set({ currentTrack: null, duration: 0 });
        localStorage.removeItem('currentTrack');
      }
    },

    playTrack: async (track, queue, playlistId = null) => {
      const { setVolume, eqBands, volume, reverbPreset } = useSettingsStore.getState();
      const { repeatMode } = get();
      
      // Apply current settings
      engine.setVolume(volume);
      engine.setEqBands(eqBands);
      engine.setReverbPreset(reverbPreset);
      
      const resolvedQueue = queue || get().queue;
      const index = resolvedQueue.findIndex(t => t.id === track.id);
      
      // Update play count and last played timestamp in centralized library store
      useLibraryStore.getState().updateTrackPlayCount(track.id);
      
      set({ 
        currentTrack: track, 
        isPlaying: true,
        queue: resolvedQueue,
        queueIndex: index !== -1 ? index : get().queueIndex,
        lastPlaylistId: playlistId
      });

      const nextIndex = index !== -1 ? index + 1 : -1;
      const nextTrackForQueue = nextIndex >= 0 && nextIndex < resolvedQueue.length
        ? resolvedQueue[nextIndex]
        : (repeatMode === 'all' && resolvedQueue.length > 0 ? resolvedQueue[0] : null);
      const visibleTracks = resolvedQueue.slice(Math.max(0, index !== -1 ? index - 1 : 0), Math.max(0, index !== -1 ? index + 2 : 2));
      preloadCoverBatch([track, nextTrackForQueue, ...visibleTracks]);

      localStorage.setItem('currentTrack', JSON.stringify(track));
      localStorage.setItem('queue', JSON.stringify(resolvedQueue));
      localStorage.setItem('queueIndex', (index !== -1 ? index : get().queueIndex).toString());
      if (playlistId) {
        localStorage.setItem('lastPlaylistId', playlistId);
      } else {
        localStorage.removeItem('lastPlaylistId');
      }

      try {
        await engine.playTrack(track);

        const nextTrack = nextIndex >= 0 && nextIndex < resolvedQueue.length
          ? resolvedQueue[nextIndex]
          : (repeatMode === 'all' && resolvedQueue.length > 0 ? resolvedQueue[0] : null);

        if (nextTrack) {
          void engine.preloadTrack(nextTrack);
        }
      } catch (err) {
        console.warn("Playback failed or aborted:", err);
        if (err instanceof Error && err.name !== 'AbortError') {
          set({ isPlaying: false });
        }
      }
    },

    pause: () => {
      engine.pause();
      set({ isPlaying: false });
    },

    resume: () => {
      engine.resume();
      set({ isPlaying: true });
    },

    next: () => {
      const { queue, queueIndex, shuffle, repeatMode } = get();
      if (queue.length === 0) return;

      if (repeatMode === 'one') {
        get().playTrack(queue[queueIndex]);
        return;
      }

      let targetTrack: Track;
      if (shuffle) {
        let nextIndex = Math.floor(Math.random() * queue.length);
        if (queue.length > 1 && nextIndex === queueIndex) {
          nextIndex = (nextIndex + 1) % queue.length;
        }
        targetTrack = queue[nextIndex];
      } else if (queueIndex < queue.length - 1) {
        targetTrack = queue[queueIndex + 1];
      } else if (repeatMode === 'all') {
        targetTrack = queue[0];
      } else {
        set({ isPlaying: false });
        return;
      }

      get().playTrack(targetTrack);
    },

    previous: () => {
      const { queue, queueIndex, currentTime, shuffle, repeatMode } = get();
      if (queue.length === 0) return;

      if (currentTime > 3) {
        engine.seek(0);
        set({ currentTime: 0 });
        localStorage.setItem('currentTime', '0');
      } else if (shuffle) {
        let prevIndex = Math.floor(Math.random() * queue.length);
        if (queue.length > 1 && prevIndex === queueIndex) {
          prevIndex = (prevIndex - 1 + queue.length) % queue.length;
        }
        const targetTrack = queue[prevIndex];
        get().playTrack(targetTrack);
      } else if (queueIndex > 0) {
        const targetTrack = queue[queueIndex - 1];
        get().playTrack(targetTrack);
      } else {
        if (repeatMode === 'all') {
          const targetTrack = queue[queue.length - 1];
          get().playTrack(targetTrack);
        } else {
          engine.seek(0);
          set({ currentTime: 0 });
          localStorage.setItem('currentTime', '0');
        }
      }
    },

    seek: (time) => {
      engine.seek(time);
      set({ currentTime: time });
      localStorage.setItem('currentTime', time.toString());
    },
    
    setViewMode: (mode) => set({ viewMode: mode }),
    setNowPlayingOpen: (open) => set({ nowPlayingOpen: open }),

    toggleShuffle: () => {
      const newShuffle = !get().shuffle;
      set({ shuffle: newShuffle });
      localStorage.setItem('shuffle', newShuffle.toString());
    },

    toggleRepeatMode: () => {
      const current = get().repeatMode;
      let nextMode: 'none' | 'one' | 'all' = 'none';
      if (current === 'none') nextMode = 'all';
      else if (current === 'all') nextMode = 'one';
      else nextMode = 'none';
      
      set({ repeatMode: nextMode });
      localStorage.setItem('repeatMode', nextMode);
    }
  };
});

export function useActivePlayer() {
  const tracks = useLibraryStore(s => s.tracks);
  const player = usePlayerStore();
  
  const currentTrack = player.currentTrack 
    ? (tracks.find(t => t.id === player.currentTrack?.id) || null) 
    : null;
    
  const queue = player.queue
    .map(qt => tracks.find(t => t.id === qt.id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t)) as typeof player.queue;
  
  return {
    ...player,
    currentTrack,
    queue
  };
}

