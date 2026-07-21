import express from "express";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { createServer as createViteServer } from "vite";

// ---------------------------------------------------------------------------
// Helpers — defined at MODULE scope so they are always in scope for all route
// handlers regardless of async function hoisting behaviour.
// ---------------------------------------------------------------------------

function isAudioFile(fileName: string): boolean {
  const normalized = fileName.toLowerCase();
  return ['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.mp4', '.m4p'].some(ext => normalized.endsWith(ext));
}

function toDisplayTitle(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Static serving of the songs directory so /songs/<filename> resolves correctly
  const songsStaticRoot = path.join(process.cwd(), 'public', 'songs');
  app.use('/songs', express.static(songsStaticRoot));

  // API Route: Dynamically scan public/songs and return every audio file found
  app.get('/api/songs-structure', async (req, res) => {
    const songsRoot = path.join(process.cwd(), 'public', 'songs');

    // ---- Diagnostic logging ----
    console.log('[/api/songs-structure] Resolved songs path:', songsRoot);
    console.log('[/api/songs-structure] Directory exists:', existsSync(songsRoot));

    try {
      const entries = await fs.readdir(songsRoot, { withFileTypes: true });
      console.log('[/api/songs-structure] Total directory entries:', entries.length, entries.map(e => e.name));

      const audioEntries = entries
        .filter(entry => entry.isFile() && isAudioFile(entry.name))
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log('[/api/songs-structure] Audio files found:', audioEntries.length, audioEntries.map(e => e.name));

      const songs = await Promise.all(audioEntries.map(async (entry) => {
        const fullPath = path.join(songsRoot, entry.name);
        const stats = await fs.stat(fullPath);
        const filePath = `/songs/${encodeURIComponent(entry.name)}`;

        return {
          id: filePath,
          title: toDisplayTitle(entry.name),
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          duration: 0,
          filePath,
          dateAdded: stats.mtimeMs,
          fileSize: stats.size,
          fileType: path.extname(entry.name).slice(1),
          parentPath: '/',
        };
      }));

      console.log('[/api/songs-structure] Returning', songs.length, 'song(s)');
      res.json({ songs, directories: ['/'] });
    } catch (err: any) {
      console.error('[/api/songs-structure] ERROR scanning public/songs:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Create playlist folder
  app.post('/api/playlists/create', async (req, res) => {
    const { parentPath, name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    try {
      const normalizedParent = (parentPath || '/').replace(/^\//, '');
      const targetDir = path.join(process.cwd(), 'songs', normalizedParent, name);
      await fs.mkdir(targetDir, { recursive: true });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Rename playlist folder
  app.post('/api/playlists/rename', async (req, res) => {
    const { folderPath, newName } = req.body;
    if (!folderPath || !newName) return res.status(400).json({ error: 'FolderPath and newName are required' });
    try {
      const normalizedFolder = folderPath.replace(/^\//, '');
      const oldDir = path.join(process.cwd(), 'songs', normalizedFolder);
      const parentDir = path.dirname(oldDir);
      const newDir = path.join(parentDir, newName);
      
      await fs.rename(oldDir, newDir);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Delete playlist folder
  app.post('/api/playlists/delete', async (req, res) => {
    const { folderPath, force } = req.body;
    if (!folderPath) return res.status(400).json({ error: 'FolderPath is required' });
    try {
      const normalizedFolder = folderPath.replace(/^\//, '');
      const dirToDelete = path.join(process.cwd(), 'songs', normalizedFolder);
      
      if (!existsSync(dirToDelete)) {
        return res.status(404).json({ error: 'Folder not found' });
      }

      // Check if folder is empty (ignoring hidden files)
      const entries = await fs.readdir(dirToDelete);
      const cleanEntries = entries.filter(e => !e.startsWith('.'));
      if (cleanEntries.length > 0 && !force) {
        return res.json({ 
          error: 'contains_items', 
          message: 'This playlist contains songs or sub-playlists. Do you want to delete it and all of its contents?' 
        });
      }
      
      await fs.rm(dirToDelete, { recursive: true, force: true });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Move songs to playlist
  app.post('/api/songs/move', async (req, res) => {
    const { songPaths, targetFolderPath } = req.body;
    if (!songPaths || !Array.isArray(songPaths) || targetFolderPath === undefined) {
      return res.status(400).json({ error: 'songPaths (array) and targetFolderPath (string) are required' });
    }
    try {
      const normalizedTarget = targetFolderPath.replace(/^\//, '');
      const targetDir = path.join(process.cwd(), 'songs', normalizedTarget);
      await fs.mkdir(targetDir, { recursive: true });

      for (const songPath of songPaths) {
        const decodedSongPath = decodeURIComponent(songPath);
        const relativePart = decodedSongPath.replace(/^\/songs\//, '');
        const oldFullPath = path.join(process.cwd(), 'songs', relativePart);
        const fileName = path.basename(oldFullPath);
        const newFullPath = path.join(targetDir, fileName);
        
        if (existsSync(oldFullPath)) {
          await fs.rename(oldFullPath, newFullPath);
        }
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Move playlist (folder) into another folder
  app.post('/api/playlists/move', async (req, res) => {
    const { folderPath, targetFolderPath } = req.body;
    if (!folderPath || targetFolderPath === undefined) {
      return res.status(400).json({ error: 'folderPath and targetFolderPath are required' });
    }
    try {
      const normalizedFolder = folderPath.replace(/^\//, '');
      const normalizedTarget = targetFolderPath.replace(/^\//, '');
      const oldDir = path.join(process.cwd(), 'songs', normalizedFolder);
      const folderName = path.basename(oldDir);
      const targetParentDir = path.join(process.cwd(), 'songs', normalizedTarget);
      const newDir = path.join(targetParentDir, folderName);

      if (existsSync(oldDir)) {
        await fs.mkdir(targetParentDir, { recursive: true });
        await fs.rename(oldDir, newDir);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Source playlist folder not found' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
