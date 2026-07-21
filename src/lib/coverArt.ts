import React, { useEffect, useState } from 'react';
import type { Track } from '../types';

export const DEFAULT_COVER_URL = '/default-cover.svg';

const loadedCoverCache = new Set<string>();
const failedCoverCache = new Set<string>();

function normalizeCoverUrl(coverUrl?: string | null): string {
  if (!coverUrl || typeof coverUrl !== 'string') {
    return DEFAULT_COVER_URL;
  }

  const trimmed = coverUrl.trim();
  if (!trimmed) {
    return DEFAULT_COVER_URL;
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\.\//, '')}`;
}

export function resolveTrackCoverUrl(coverUrl?: string | null): string {
  const normalized = normalizeCoverUrl(coverUrl);
  return normalized;
}

export function preloadCoverArt(coverUrl?: string | null): Promise<string> {
  const resolved = resolveTrackCoverUrl(coverUrl);

  if (resolved === DEFAULT_COVER_URL) {
    return Promise.resolve(DEFAULT_COVER_URL);
  }

  if (loadedCoverCache.has(resolved)) {
    return Promise.resolve(resolved);
  }

  if (failedCoverCache.has(resolved)) {
    return Promise.resolve(DEFAULT_COVER_URL);
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      loadedCoverCache.add(resolved);
      resolve(resolved);
    };
    image.onerror = () => {
      failedCoverCache.add(resolved);
      resolve(DEFAULT_COVER_URL);
    };
    image.src = resolved;
  });
}

export function preloadCoverBatch(tracks: Array<Track | null | undefined>) {
  void Promise.allSettled(
    tracks
      .filter((track): track is Track => Boolean(track))
      .map((track) => preloadCoverArt(track.coverUrl))
  );
}

function buildClassName(...parts: Array<string | undefined | null>) {
  return parts.filter(Boolean).join(' ').trim();
}

export function useCoverArt(coverUrl?: string | null) {
  const [displayUrl, setDisplayUrl] = useState<string>(DEFAULT_COVER_URL);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const nextUrl = resolveTrackCoverUrl(coverUrl);

    if (nextUrl === DEFAULT_COVER_URL) {
      setDisplayUrl(DEFAULT_COVER_URL);
      setIsLoaded(true);
      return;
    }

    if (loadedCoverCache.has(nextUrl)) {
      setDisplayUrl(nextUrl);
      setIsLoaded(true);
      return;
    }

    if (failedCoverCache.has(nextUrl)) {
      setDisplayUrl(DEFAULT_COVER_URL);
      setIsLoaded(true);
      return;
    }

    let active = true;
    setDisplayUrl(DEFAULT_COVER_URL);
    setIsLoaded(false);

    void preloadCoverArt(nextUrl).then((resolvedUrl) => {
      if (!active) {
        return;
      }
      setDisplayUrl(resolvedUrl);
      setIsLoaded(resolvedUrl !== DEFAULT_COVER_URL);
    });

    return () => {
      active = false;
    };
  }, [coverUrl]);

  return { displayUrl, isLoaded, resolvedUrl: resolveTrackCoverUrl(coverUrl) };
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
