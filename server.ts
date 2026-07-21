import express from "express";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { createServer as createViteServer } from "vite";
import * as musicMetadata from "music-metadata";

// Recursive function to scan directories and tracks
async function scanDirectory(currentDir: string, rootDir: string, directoriesList: string[], tracksList: any[]) {
  // Add currentDir to directoriesList relative to rootDir
  const relDir = path.relative(rootDir, currentDir);
  const formattedRelDir = relDir ? '/' + relDir.replace(/\\/g, '/') : '/';
  if (!directoriesList.includes(formattedRelDir)) {
    directoriesList.push(formattedRelDir);
  }

  try {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, rootDir, directoriesList, tracksList);
      } else if (entry.isFile()) {
        // Ignore hidden/system files
        if (entry.name.startsWith('.') || 
            ['thumbs.db', 'desktop.ini', 'ehthumbs.db'].includes(entry.name.toLowerCase())) {
          continue;
        }
        
        const ext = path.extname(entry.name).toLowerCase();
        if (['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg'].includes(ext)) {
          const stats = await fs.stat(fullPath);
          const relFilePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
          
          // Encode each segment of path to prevent URL issues
          const encodedFilePath = `/songs/${relFilePath.split('/').map(encodeURIComponent).join('/')}`;
          
          let title = path.basename(entry.name, ext);
          let artist = "Unknown Artist";
          let album = "Unknown Album";
          let duration = 0;
          let hasEmbeddedCover = false;

          try {
            const metadata = await musicMetadata.parseFile(fullPath);
            title = metadata.common.title || title;
            artist = metadata.common.artist || artist;
            album = metadata.common.album || album;
            duration = metadata.format.duration || 0;
            if (metadata.common.picture && metadata.common.picture.length > 0) {
              hasEmbeddedCover = true;
            }
          } catch (err) {
            // Suppress warnings to keep logs clean
          }

          let coverUrl: string | undefined = undefined;
          if (hasEmbeddedCover) {
            coverUrl = `/api/cover?path=${encodeURIComponent('songs/' + relFilePath)}`;
          }

          tracksList.push({
            id: encodedFilePath,
            title,
            artist,
            album,
            duration,
            filePath: encodedFilePath,
            dateAdded: stats.birthtimeMs || stats.mtimeMs || Date.now(),
            fileSize: stats.size,
            fileType: ext === '.mp3' ? 'audio/mpeg' : `audio/${ext.slice(1)}`,
            coverUrl,
            parentPath: formattedRelDir
          });
        }
      }
    }
  } catch (err) {
    console.error(`Error scanning directory: ${currentDir}`, err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Static serving of songs directory with cache control
  app.use('/songs', express.static(path.join(process.cwd(), 'songs')));

  // API Route: Scan songs directory and return flat songs & folder structure
  app.get('/api/songs-structure', async (req, res) => {
    try {
      const rootDir = path.join(process.cwd(), 'songs');
      const directoriesList: string[] = [];
      const tracksList: any[] = [];
      
      // Ensure songs directory exists
      if (!existsSync(rootDir)) {
        await fs.mkdir(rootDir, { recursive: true });
      }
      
      await scanDirectory(rootDir, rootDir, directoriesList, tracksList);
      
      res.json({
        songs: tracksList,
        directories: directoriesList
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Get embedded cover image
  app.get('/api/cover', async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).send('Path required');
    try {
      const decodedPath = decodeURIComponent(filePath);
      const fullPath = path.join(process.cwd(), decodedPath.replace(/^\//, ''));
      if (!existsSync(fullPath)) {
        return res.status(404).send('File not found');
      }
      const metadata = await musicMetadata.parseFile(fullPath);
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0];
        res.contentType(pic.format);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(Buffer.from(pic.data));
      } else {
        res.status(404).send('No cover found');
      }
    } catch (err: any) {
      res.status(500).send(err.message);
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
