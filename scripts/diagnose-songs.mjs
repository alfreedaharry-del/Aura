// Standalone diagnostic — no server, no Vite, no React.
// Run with: node scripts/diagnose-songs.mjs
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== DIAGNOSTICS ===');
console.log('process.cwd()           :', process.cwd());
console.log('__dirname (this script) :', __dirname);

// 1. Check what server.ts would compute
const fromCwd = path.join(process.cwd(), 'public', 'songs');
const fromScriptDir = path.join(__dirname, '..', 'public', 'songs');

console.log('\n--- Path resolution ---');
console.log('path via process.cwd()  :', fromCwd);
console.log('path via __dirname/../  :', path.resolve(fromScriptDir));

// 2. Existence checks
console.log('\n--- Existence checks ---');
console.log('process.cwd()/public/songs exists :', fs.existsSync(fromCwd));
console.log('__dirname/../public/songs exists   :', fs.existsSync(path.resolve(fromScriptDir)));

// 3. Try reading directory contents from both paths
function tryReadDir(label, dirPath) {
  console.log(`\n--- Contents of "${label}" (${dirPath}) ---`);
  if (!fs.existsSync(dirPath)) {
    console.log('  ✗ Directory does not exist');
    return;
  }
  const entries = fs.readdirSync(dirPath);
  if (entries.length === 0) {
    console.log('  ✗ Directory exists but is EMPTY');
  } else {
    console.log(`  ✓ ${entries.length} entries:`);
    entries.forEach(e => console.log('    -', e));
  }
}

tryReadDir('process.cwd()/public/songs', fromCwd);
tryReadDir('__dirname/../public/songs', path.resolve(fromScriptDir));

// 4. Also check if there is a top-level songs/ directory (a common confusion)
const topLevelSongs = path.join(process.cwd(), 'songs');
console.log('\n--- Top-level songs/ (common wrong path) ---');
console.log('path                    :', topLevelSongs);
console.log('exists                  :', fs.existsSync(topLevelSongs));
if (fs.existsSync(topLevelSongs)) {
  const entries = fs.readdirSync(topLevelSongs);
  console.log('entries                 :', entries);
}

// 5. Audio file filtering (same logic as server.ts)
const AUDIO_EXTS = ['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.mp4', '.m4p'];
function isAudio(name) {
  const n = name.toLowerCase();
  return AUDIO_EXTS.some(ext => n.endsWith(ext));
}

const bestPath = fs.existsSync(fromCwd) ? fromCwd : (fs.existsSync(path.resolve(fromScriptDir)) ? path.resolve(fromScriptDir) : null);
if (bestPath) {
  const all = fs.readdirSync(bestPath);
  const audio = all.filter(isAudio);
  console.log('\n--- Audio file filter result ---');
  console.log('All entries :', all);
  console.log('Audio only  :', audio);
} else {
  console.log('\n✗ Could not locate any valid songs directory to test filtering.');
}

console.log('\n=== END DIAGNOSTICS ===');
