import { Track } from '../types';

export interface LibraryStructure {
  songs: Track[];
  directories: string[];
}

function normalizeTrack(track: Partial<Track> & Record<string, any>): Track {
  const filePath = typeof track.filePath === 'string' ? track.filePath : '';
  const title = track.title || track.name || filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Untitled Track';

  return {
    id: track.id || filePath || title,
    title,
    artist: track.artist || 'Unknown Artist',
    album: track.album || 'Unknown Album',
    duration: track.duration || 0,
    coverUrl: track.coverUrl || filePath,
    filePath,
    dateAdded: track.dateAdded || Date.now(),
    playCount: 0,
    fileSize: track.fileSize,
    fileType: track.fileType,
    parentPath: track.parentPath || '/',
  };
}

export class MusicLibraryService {
  static async loadFixedLibrary(): Promise<LibraryStructure> {
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        const response = await fetch('/api/songs-structure', { cache: 'no-store' });
        if (response.ok) {
          const payload = await response.json();
          const songs = Array.isArray(payload.songs) ? payload.songs.map(normalizeTrack) : [];
          return {
            songs,
            directories: Array.isArray(payload.directories) ? payload.directories : ['/'],
          };
        }
      } catch (error) {
        console.warn('Unable to load songs from public/songs', error);
      }
    }

    return {
      songs: [],
      directories: ['/']
    };
  }
}
