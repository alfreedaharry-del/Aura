import { existsSync, statSync } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';

interface GeneratedTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  filePath: string;
  dateAdded: number;
  fileSize: number;
  fileType: string;
  parentPath?: string;
}

const projectRoot = process.cwd();
const preferredSongsRoot = path.join(projectRoot, 'public', 'songs');
const fallbackSongsRoot = path.join(projectRoot, 'songs');
const songsRoot = existsSync(preferredSongsRoot) ? preferredSongsRoot : fallbackSongsRoot;
const outputPath = path.join(projectRoot, 'src', 'lib', 'bundledMusicRegistry.generated.json');
const supportedExtensions = new Set(['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg']);

async function walkDirectory(currentDir: string, tracks: GeneratedTrack[], rootDir: string) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, tracks, rootDir);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!supportedExtensions.has(ext)) {
      continue;
    }

    const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
    const publicPath = `/songs/${relativePath}`;
    const stats = statSync(fullPath);
    const baseTitle = path.basename(entry.name, ext);

    let title = baseTitle;
    let artist = 'Unknown Artist';
    let album: string | undefined;
    let duration = 0;

    try {
      const metadata = await parseFile(fullPath);
      title = metadata.common.title || baseTitle;
      artist = metadata.common.artist || artist;
      album = metadata.common.album || undefined;
      duration = metadata.format.duration || 0;
    } catch (error) {
      console.warn(`[registry] Could not read metadata for ${publicPath}`, error);
    }

    tracks.push({
      id: publicPath,
      title,
      artist,
      album,
      duration,
      filePath: publicPath,
      dateAdded: stats.birthtimeMs || stats.mtimeMs || Date.now(),
      fileSize: stats.size,
      fileType: `audio/${ext.slice(1)}`,
      parentPath: path.dirname(relativePath).replace(/\\/g, '/') || '/',
    });
  }
}

async function generateRegistry() {
  if (!existsSync(songsRoot)) {
    console.warn(`[registry] Songs directory not found: ${songsRoot}`);
    await fs.writeFile(outputPath, '[]');
    return;
  }

  const tracks: GeneratedTrack[] = [];
  await walkDirectory(songsRoot, tracks, songsRoot);
  tracks.sort((a, b) => a.title.localeCompare(b.title));

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(tracks, null, 2));
  console.log(`[registry] Wrote ${tracks.length} bundled tracks to ${outputPath}`);
}

void generateRegistry();
