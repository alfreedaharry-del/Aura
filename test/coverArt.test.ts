import assert from 'node:assert/strict';
import test from 'node:test';
import { preloadCoverArt, DEFAULT_COVER_URL } from '../src/lib/coverArt';

test('preloadCoverArt falls back to the default cover for missing audio path', async () => {
  const result = await preloadCoverArt(undefined);
  assert.equal(result, DEFAULT_COVER_URL);
});
