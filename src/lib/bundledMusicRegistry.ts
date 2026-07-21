import type { Track } from '../types';
import generatedRegistry from './bundledMusicRegistry.generated.json';

function normalizeTrack(track: any): Track {
  return {
    id: track.id,
    title: track.title || 'Untitled Track',
    artist: track.artist || 'Unknown Artist',
    album: track.album || 'Unknown Album',
    duration: track.duration || 0,
    coverUrl: track.filePath,
    filePath: track.filePath,
    dateAdded: track.dateAdded || Date.now(),
    playCount: 0,
    fileSize: track.fileSize,
    fileType: track.fileType,
    parentPath: track.parentPath,
  };
}

export const bundledMusicRegistry: Track[] = (generatedRegistry as any[]).map(normalizeTrack);

export function getBundledMusicRegistry(): Track[] {
  return bundledMusicRegistry.map(track => ({ ...track }));
}
