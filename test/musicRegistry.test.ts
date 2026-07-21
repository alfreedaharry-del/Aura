import assert from 'node:assert/strict';
import test from 'node:test';
import { bundledMusicRegistry } from '../src/lib/bundledMusicRegistry';

test('bundled music registry contains playable tracks from the project songs folder', () => {
  assert.ok(bundledMusicRegistry.length > 0, 'Expected bundled music registry to include tracks');

  for (const track of bundledMusicRegistry) {
    assert.ok(track.id, 'Each track should have an id');
    assert.ok(track.title, 'Each track should have a title');
    assert.ok(track.artist, 'Each track should have an artist');
    assert.ok(track.filePath.startsWith('/songs/'), 'Each track should use a public /songs URL');
  }
});
