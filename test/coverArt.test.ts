import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveTrackCoverUrl, DEFAULT_COVER_URL } from '../src/lib/coverArt';

test('resolveTrackCoverUrl falls back to the default cover for missing values', () => {
  assert.equal(resolveTrackCoverUrl(undefined), DEFAULT_COVER_URL);
  assert.equal(resolveTrackCoverUrl(''), DEFAULT_COVER_URL);
  assert.equal(resolveTrackCoverUrl('/default-cover.svg'), DEFAULT_COVER_URL);
});

test('resolveTrackCoverUrl preserves absolute URLs', () => {
  const absoluteUrl = 'https://cdn.example.com/cover.jpg';
  assert.equal(resolveTrackCoverUrl(absoluteUrl), absoluteUrl);
});
