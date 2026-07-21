import { Track } from '../types';
import { getBundledMusicRegistry } from './bundledMusicRegistry';

export interface LibraryStructure {
  songs: Track[];
  directories: string[];
}

export class MusicLibraryService {
  static async loadFixedLibrary(): Promise<LibraryStructure> {
    const registryTracks = getBundledMusicRegistry();
    const verifiedSongs: Track[] = [];

    for (const track of registryTracks) {
      const normalizedTrack: Track = {
        ...track,
        album: track.album || 'Unknown Album',
        coverUrl: track.coverUrl || '/default-cover.svg',
      };

      try {
        const response = await fetch(normalizedTrack.filePath, { method: 'HEAD' });
        if (!response.ok) {
          console.warn(`[music] Skipping missing bundled track: ${normalizedTrack.filePath}`);
          continue;
        }
      } catch (error) {
        console.warn(`[music] Skipping inaccessible bundled track: ${normalizedTrack.filePath}`, error);
        continue;
      }

      verifiedSongs.push(normalizedTrack);
    }

    return {
      songs: verifiedSongs,
      directories: ['/']
    };
  }
}
