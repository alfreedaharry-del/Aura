import React, { useEffect, useState } from 'react';
import type { Track } from '../types';
import { parseBlob, type IPicture } from 'music-metadata-browser';

export const DEFAULT_COVER_URL = '/default-cover.svg';

const coverUrlCache = new Map<string, string | null>();
const coverParsingPromises = new Map<string, Promise<string | null>>();

function createCoverBlobUrl(picture: IPicture): string {
  const blob = new Blob([picture.data], { type: picture.format || 'image/jpeg' });
  console.log('[coverArt] Blob created', 'mimeType=', picture.format || 'image/jpeg', 'size=', picture.data?.length ?? 0);
  const blobUrl = URL.createObjectURL(blob);
  console.log('[coverArt] URL.createObjectURL result', blobUrl);
  return blobUrl;
}

export async function preloadCoverArt(audioPath?: string | null): Promise<string> {
  if (!audioPath) {
    return DEFAULT_COVER_URL;
  }

  if (coverUrlCache.has(audioPath)) {
    const cached = coverUrlCache.get(audioPath);
    return cached ?? DEFAULT_COVER_URL;
  }

  if (coverParsingPromises.has(audioPath)) {
    const cachedPromise = coverParsingPromises.get(audioPath)!;
    const result = await cachedPromise;
    return result ?? DEFAULT_COVER_URL;
  }

  const parsePromise = (async (): Promise<string | null> => {
    try {
      console.log('[coverArt] MP3 load start', audioPath);
      const response = await fetch(audioPath);
      console.log('[coverArt] MP3 fetched', audioPath, 'status=', response.status, 'ok=', response.ok);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio for artwork: ${response.status}`);
      }

      const blob = await response.blob();
      console.log('[coverArt] MP3 loaded', audioPath, 'blobSize=', blob.size, 'type=', blob.type);

      const metadata = await parseBlob(blob);
      console.log('[coverArt] Metadata parsed', audioPath, 'common=', metadata.common)

      const picture = metadata.common.picture?.[0];
      if (!picture) {
        console.warn('[coverArt] Artwork not found in metadata', audioPath, 'pictures=', metadata.common.picture?.length ?? 0);
        coverUrlCache.set(audioPath, null);
        return null;
      }

      console.log('[coverArt] Artwork found', audioPath, 'mimeType=', picture.format, 'byteLength=', picture.data?.length ?? 0);
      const coverUrl = createCoverBlobUrl(picture);
      console.log('[coverArt] Blob URL created', audioPath, coverUrl);
      coverUrlCache.set(audioPath, coverUrl);
      return coverUrl;
    } catch (error) {
      console.error('[coverArt] Could not extract embedded artwork for', audioPath, error);
    }

    coverUrlCache.set(audioPath, null);
    return null;
  })();

  coverParsingPromises.set(audioPath, parsePromise);
  const result = await parsePromise;
  return result ?? DEFAULT_COVER_URL;
}

export function preloadCoverBatch(tracks: Array<Track | null | undefined>) {
  void Promise.allSettled(
    tracks
      .filter((track): track is Track => Boolean(track))
      .map((track) => preloadCoverArt(track.filePath))
  );
}

function buildClassName(...parts: Array<string | undefined | null>) {
  return parts.filter(Boolean).join(' ').trim();
}

export function useCoverArt(audioPath?: string | null) {
  const [displayUrl, setDisplayUrl] = useState<string>(DEFAULT_COVER_URL);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    if (!audioPath) {
      setDisplayUrl(DEFAULT_COVER_URL);
      setIsLoaded(false);
      return;
    }

    setDisplayUrl(DEFAULT_COVER_URL);
    setIsLoaded(false);

    void preloadCoverArt(audioPath).then((resolvedUrl) => {
      if (!active) {
        return;
      }

      if (resolvedUrl === DEFAULT_COVER_URL) {
        setDisplayUrl(DEFAULT_COVER_URL);
        setIsLoaded(false);
      } else {
        setDisplayUrl(resolvedUrl);
        setIsLoaded(true);
      }
    });

    return () => {
      active = false;
    };
  }, [audioPath]);

  return { displayUrl, isLoaded };
}

interface CoverArtImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  priority?: boolean;
  wrapperClassName?: string;
  fallbackClassName?: string;
}

export const CoverArtImage: React.FC<CoverArtImageProps> = ({
  src,
  alt = '',
  priority = false,
  className = '',
  wrapperClassName = '',
  fallbackClassName = '',
  style,
  ...props
}) => {
  const { displayUrl, isLoaded } = useCoverArt(src);

  useEffect(() => {
    console.log('[coverArt] React component received src', src, 'displayUrl=', displayUrl, 'isLoaded=', isLoaded);
  }, [src, displayUrl, isLoaded]);

  useEffect(() => {
    if (displayUrl && displayUrl !== DEFAULT_COVER_URL) {
      console.log('[coverArt] Image rendered with blob URL', displayUrl);
    }
  }, [displayUrl]);

  return React.createElement(
    'div',
    { className: buildClassName('relative h-full w-full overflow-hidden bg-[var(--bg-elevated)]', wrapperClassName) },
    React.createElement('div', {
      className: buildClassName('absolute inset-0 bg-cover bg-center', fallbackClassName),
      style: { backgroundImage: `url(${DEFAULT_COVER_URL})` },
    }),
    React.createElement('img', {
      ...props,
      src: displayUrl,
      alt,
      loading: priority ? 'eager' : 'lazy',
      decoding: 'async',
      className: buildClassName('absolute inset-0 h-full w-full object-cover transition-opacity duration-500', className),
      style: { ...(style || {}), opacity: isLoaded && displayUrl !== DEFAULT_COVER_URL ? 1 : 0 },
    })
  );
};
