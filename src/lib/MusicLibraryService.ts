import { Track } from '../types';

export interface LibraryStructure {
  songs: Track[];
  directories: string[];
}

export class MusicLibraryService {
  static async loadFixedLibrary(): Promise<LibraryStructure> {
    const res = await fetch('/api/songs-structure');
    if (!res.ok) {
      throw new Error("Failed to load library structure from server");
    }
    const data = await res.json();
    
    const songsWithCovers = (data.songs || []).map((track: Track) => {
      return {
        ...track,
        coverUrl: track.coverUrl || undefined
      };
    });

    return {
      songs: songsWithCovers,
      directories: data.directories || []
    };
  }
}
