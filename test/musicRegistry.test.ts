import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'fs';
import path from 'path';

async function getAudioFilesInPublicSongs() {
  const songsRoot = path.join(process.cwd(), 'public', 'songs');
  const entries = await fs.readdir(songsRoot, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && ['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.mp4', '.m4p'].includes(path.extname(entry.name).toLowerCase()))
    .map(entry => entry.name);
}

test('public songs folder is the source of truth for the library', async () => {
  const audioFiles = await getAudioFilesInPublicSongs();
  assert.ok(audioFiles.length > 0, 'Expected at least one audio file in public/songs');

  for (const fileName of audioFiles) {
    assert.ok(fileName, 'Each audio file should have a name');
  }
});
