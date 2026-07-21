import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Track, Playlist, AppSettings } from '../types';

interface MusicPlayerDB extends DBSchema {
  tracks: {
    key: string;
    value: Track;
    indexes: {
      'by-artist': string;
      'by-album': string;
      'by-date-added': number;
      'by-play-count': number;
    };
  };
  playlists: {
    key: string;
    value: Playlist;
  };
  settings: {
    key: string;
    value: Partial<AppSettings>;
  };
}

let dbPromise: Promise<IDBPDatabase<MusicPlayerDB>> | null = null;
let useFallback = false;

// Memory storage fallback
const memoryStore: {
  tracks: Map<string, Track>;
  playlists: Map<string, Playlist>;
  settings: Partial<AppSettings>;
} = {
  tracks: new Map(),
  playlists: new Map(),
  settings: {}
};

// Populate memoryStore from localStorage if available (as a semi-persistent fallback)
try {
  const localTracks = localStorage.getItem('aura-fallback-tracks');
  if (localTracks) {
    const list = JSON.parse(localTracks);
    list.forEach((t: Track) => memoryStore.tracks.set(t.id, t));
  }
  const localPlaylists = localStorage.getItem('aura-fallback-playlists');
  if (localPlaylists) {
    const list = JSON.parse(localPlaylists);
    list.forEach((p: Playlist) => memoryStore.playlists.set(p.id, p));
  }
  const localSettings = localStorage.getItem('aura-fallback-settings');
  if (localSettings) {
    memoryStore.settings = JSON.parse(localSettings);
  }
} catch (e) {
  // Ignore localStorage block
}

function persistFallback() {
  try {
    localStorage.setItem('aura-fallback-tracks', JSON.stringify(Array.from(memoryStore.tracks.values())));
    localStorage.setItem('aura-fallback-playlists', JSON.stringify(Array.from(memoryStore.playlists.values())));
    localStorage.setItem('aura-fallback-settings', JSON.stringify(memoryStore.settings));
  } catch (e) {
    // Ignore
  }
}

export const initDB = async (): Promise<IDBPDatabase<MusicPlayerDB> | null> => {
  if (useFallback) return null;
  if (!dbPromise) {
    try {
      dbPromise = openDB<MusicPlayerDB>('aura-music-player', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('tracks')) {
            const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
            trackStore.createIndex('by-artist', 'artist');
            trackStore.createIndex('by-album', 'album');
            trackStore.createIndex('by-date-added', 'dateAdded');
            trackStore.createIndex('by-play-count', 'playCount');
          }
          if (!db.objectStoreNames.contains('playlists')) {
            db.createObjectStore('playlists', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
        },
      });
      await dbPromise;
    } catch (err) {
      console.warn("IndexedDB not supported or blocked, switching to memory/localStorage fallback", err);
      useFallback = true;
      dbPromise = null;
      return null;
    }
  }
  return dbPromise;
};

export const dbStore = {
  async getSettings(): Promise<Partial<AppSettings>> {
    try {
      const db = await initDB();
      if (db) {
        const settings = await db.get('settings', 'app-settings');
        return settings || {};
      }
    } catch (e) {
      useFallback = true;
    }
    return memoryStore.settings;
  },
  
  async saveSettings(settings: Partial<AppSettings>) {
    try {
      const db = await initDB();
      if (db) {
        await db.put('settings', settings, 'app-settings');
        return;
      }
    } catch (e) {
      useFallback = true;
    }
    memoryStore.settings = settings;
    persistFallback();
  },

  async getAllTracks(): Promise<Track[]> {
    try {
      const db = await initDB();
      if (db) {
        return await db.getAll('tracks');
      }
    } catch (e) {
      useFallback = true;
    }
    return Array.from(memoryStore.tracks.values());
  },

  async saveTrack(track: Track) {
    try {
      const db = await initDB();
      if (db) {
        await db.put('tracks', track);
        return;
      }
    } catch (e) {
      useFallback = true;
    }
    memoryStore.tracks.set(track.id, track);
    persistFallback();
  },
  
  async saveTracks(tracks: Track[]) {
    try {
      const db = await initDB();
      if (db) {
        const tx = db.transaction('tracks', 'readwrite');
        await Promise.all(tracks.map(track => tx.store.put(track)));
        await tx.done;
        return;
      }
    } catch (e) {
      useFallback = true;
    }
    tracks.forEach(track => memoryStore.tracks.set(track.id, track));
    persistFallback();
  },

  async clearTracks() {
    try {
      const db = await initDB();
      if (db) {
        await db.clear('tracks');
        return;
      }
    } catch (e) {
      useFallback = true;
    }
    memoryStore.tracks.clear();
    persistFallback();
  },

  async getAllPlaylists(): Promise<Playlist[]> {
    try {
      const db = await initDB();
      if (db) {
        return await db.getAll('playlists');
      }
    } catch (e) {
      useFallback = true;
    }
    return Array.from(memoryStore.playlists.values());
  },

  async savePlaylist(playlist: Playlist) {
    try {
      const db = await initDB();
      if (db) {
        await db.put('playlists', playlist);
        return;
      }
    } catch (e) {
      useFallback = true;
    }
    memoryStore.playlists.set(playlist.id, playlist);
    persistFallback();
  },

  async deletePlaylist(id: string) {
    try {
      const db = await initDB();
      if (db) {
        await db.delete('playlists', id);
        return;
      }
    } catch (e) {
      useFallback = true;
    }
    memoryStore.playlists.delete(id);
    persistFallback();
  }
};
