import { Track } from '../types';
import { getBundledMusicRegistry } from './bundledMusicRegistry';

export interface LibraryStructure {
  songs: Track[];
  directories: string[];
}

export class MusicLibraryService {
  static async loadFixedLibrary(): Promise<LibraryStructure> {
    const registryTracks = getBundledMusicRegistry();
    const normalizedSongs: Track[] = registryTracks.map(track => ({
      ...track,
      album: track.album || 'Unknown Album',
      coverUrl: track.coverUrl || '/default-cover.svg',
    }));

    return {
      songs: normalizedSongs,
      directories: ['/']
    };
  }
}
