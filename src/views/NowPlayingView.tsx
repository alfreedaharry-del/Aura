import React, { useState, useEffect, useRef } from 'react';
import { useActivePlayer } from '../store/usePlayerStore';
import { ChevronDown, Repeat, Shuffle, SkipForward, SkipBack, Play, Pause } from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeStore } from '../store/useThemeStore';
import { Track } from '../types';
import { CoverArtImage } from '../lib/coverArt';

interface NowPlayingProps {
  onClose: () => void;
}

export const NowPlayingView: React.FC<NowPlayingProps> = ({ onClose }) => {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    pause, 
    resume, 
    next, 
    previous,
    shuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeatMode,
    seek,
    playTrack,
    queue
  } = useActivePlayer();

  const { activeTheme } = useThemeStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isLandscapeTabletOrDesktop, setIsLandscapeTabletOrDesktop] = useState(false);

  // Responsive layout listener for landscape tablet / desktop
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px) and (orientation: landscape)');
    setIsLandscapeTabletOrDesktop(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setIsLandscapeTabletOrDesktop(e.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Compute contrast brightness for premium adaptation
  const isDarkBg = React.useMemo(() => {
    if (!activeTheme || !activeTheme.backgroundColor) return true;
    const color = activeTheme.backgroundColor;
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      let r = 0, g = 0, b = 0;
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      }
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 135;
    }
    return true; // default dark
  }, [activeTheme]);

  if (!currentTrack) return null;

  // Formatting helpers
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Click & drag handling for premium precision timeline scrubbing
  const handleTimelinePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    
    const updateSeek = (clientX: number) => {
      const pos = (clientX - rect.left) / rect.width;
      const clamped = Math.max(0, Math.min(1, pos));
      seek(clamped * duration);
    };

    updateSeek(e.clientX);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateSeek(moveEvent.clientX);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Playback queue item selector action
  const handlePlayTrackFromQueue = (track: Track) => {
    if (track.id === currentTrack.id) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      playTrack(track, queue);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', damping: 26, stiffness: 180 }}
      className="absolute inset-0 z-[60] bg-[var(--bg-base)] flex flex-col overflow-hidden"
    >
      {/* Background ambient lighting glow (subtle cover overlay) */}
      {currentTrack.coverUrl && (
        <div 
          className="absolute inset-0 opacity-[0.06] sm:opacity-[0.10] bg-cover bg-center blur-[120px] scale-150 transition-all duration-1000 pointer-events-none"
          style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
        />
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 py-4 shrink-0">
        <button 
          onClick={onClose}
          className="p-2.5 rounded-full bg-[var(--bg-elevated)] hover:scale-105 active:scale-95 transition-all text-[var(--text-primary)] border border-white/5 shadow-md flex items-center justify-center cursor-pointer"
        >
          <ChevronDown size={20} />
        </button>
        <span className="text-xs font-mono font-bold tracking-[0.25em] text-[var(--text-tertiary)] uppercase select-none">
          Now Playing
        </span>
        <div className="w-10" />
      </div>

      <style>{`
        .now-playing-cover {
          width: min(300px, 32vh);
          height: min(300px, 32vh);
          max-width: 80vw;
          max-height: 80vw;
        }
        .now-playing-wheel {
          width: min(210px, 24vh);
          height: min(210px, 24vh);
          max-width: 65vw;
          max-height: 65vw;
        }
        
        @media (min-width: 640px) {
          .now-playing-cover {
            width: min(340px, 35vh);
            height: min(340px, 35vh);
          }
          .now-playing-wheel {
            width: min(230px, 25vh);
            height: min(230px, 25vh);
          }
        }

        @media (min-width: 1024px) {
          .now-playing-cover {
            width: min(360px, 36vh);
            height: min(360px, 36vh);
          }
          .now-playing-wheel {
            width: min(240px, 26vh);
            height: min(240px, 26vh);
          }
        }

        @media (max-height: 650px) {
          .now-playing-cover {
            width: min(190px, 28vh) !important;
            height: min(190px, 28vh) !important;
          }
          .now-playing-wheel {
            width: min(160px, 21vh) !important;
            height: min(160px, 21vh) !important;
          }
        }
      `}</style>

      {/* Split Interactive Panel Grid */}
      <div className={`relative z-10 flex-1 flex ${isLandscapeTabletOrDesktop ? 'flex-row' : 'flex-col'} items-center justify-center w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 py-4 md:py-6 overflow-hidden gap-8 lg:gap-12`}>
        
        {/* LEFT SIDE: Now Playing Controls (Vertically Centered) */}
        <div className="flex-1 flex flex-col justify-center items-center py-1 md:py-3 max-h-full overflow-hidden w-full select-none">
          
          {/* Perfect 1:1 Square Album Cover - Engraved & Recessed into Surface */}
          <div 
            className="relative aspect-square bg-zinc-950 rounded-[20px] overflow-hidden select-none now-playing-cover"
            style={{
              // Outer machined edge bevel transition (recessed lip)
              border: isDarkBg 
                ? '1.5px solid rgba(0, 0, 0, 0.45)' 
                : '1.5px solid rgba(0, 0, 0, 0.08)',
              background: isDarkBg ? '#0b0c10' : '#e6e9ef',
            }}
          >
            {/* 1. Base Album Image */}
            {currentTrack.coverUrl ? (
              <CoverArtImage 
                src={currentTrack.coverUrl} 
                className="select-none pointer-events-none" 
                wrapperClassName="w-full h-full"
                fallbackClassName="bg-gradient-to-br from-zinc-800 to-zinc-900"
                alt={currentTrack.title}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-6 text-center select-none">
                <span className="text-zinc-500 font-display font-medium tracking-wide text-sm">
                  {currentTrack.title}
                </span>
              </div>
            )}

            {/* 2. Top Highlight Bevel (Light entering from above catching top lip) */}
            <div 
              className="absolute inset-0 pointer-events-none z-10 rounded-[18px]"
              style={{
                boxShadow: isDarkBg
                  ? 'inset 0 1.5px 2px rgba(255, 255, 255, 0.22)'
                  : 'inset 0 1.5px 3px rgba(255, 255, 255, 0.95)'
              }}
            />

            {/* 3. Deep Bottom/Sides Inner Shadow (Illusion that image sits below surface) */}
            <div 
              className="absolute inset-0 pointer-events-none z-10 rounded-[18px]"
              style={{
                boxShadow: isDarkBg
                  ? 'inset 0 -12px 24px rgba(0, 0, 0, 0.85), inset 0 -4px 10px rgba(0, 0, 0, 0.9), inset 4px 0 8px rgba(0, 0, 0, 0.5), inset -4px 0 8px rgba(0, 0, 0, 0.5)'
                  : 'inset 0 -12px 20px rgba(0, 0, 0, 0.16), inset 0 -4px 8px rgba(0, 0, 0, 0.12), inset 3px 0 6px rgba(0, 0, 0, 0.08), inset -3px 0 6px rgba(0, 0, 0, 0.08)'
              }}
            />

            {/* 4. Fine interior shadow/rim for perfect smooth transition */}
            <div 
              className="absolute inset-0 pointer-events-none z-15 rounded-[18px]"
              style={{
                border: isDarkBg
                  ? '1px solid rgba(0, 0, 0, 0.6)'
                  : '1px solid rgba(0, 0, 0, 0.05)'
              }}
            />
          </div>

          {/* Minimalist Typography Song Details */}
          <div className="text-center select-none max-w-full px-4" style={{ marginTop: 'min(16px, 2vh)' }}>
            <h1 className="text-lg sm:text-2xl font-display font-black tracking-tight text-[var(--text-primary)] truncate max-w-[280px] sm:max-w-[340px] md:max-w-[320px] lg:max-w-[380px]">
              {currentTrack.title}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-0.5 truncate max-w-[280px] sm:max-w-[340px]">
              {currentTrack.artist}
            </p>
            {currentTrack.album && (
              <p className="text-[9px] font-mono font-bold tracking-[0.16em] text-[var(--text-tertiary)] uppercase mt-1">
                {currentTrack.album}
              </p>
            )}
          </div>

          {/* Thin Premium Timeline Slider with 3D Satin hardware knob */}
          <div className="w-full max-w-[240px] sm:max-w-[280px] md:max-w-[300px] lg:max-w-[320px] xl:max-w-[360px]" style={{ marginTop: 'min(16px, 2.2vh)' }}>
            <div 
              ref={timelineRef}
              onPointerDown={handleTimelinePointerDown}
              className="h-5 w-full flex items-center cursor-pointer relative select-none group"
            >
              {/* Timeline Track */}
              <div className="w-full h-[3px] bg-zinc-300 dark:bg-zinc-800 rounded-full overflow-visible relative">
                {/* Active progress color filling */}
                <div 
                  className="absolute left-0 top-0 h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />

                {/* 3D Precision-Machined hardware slider knob */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full flex items-center justify-center pointer-events-none select-none transition-transform group-hover:scale-105"
                  style={{ 
                    left: `${(currentTime / (duration || 1)) * 100}%`,
                    boxShadow: isDarkBg 
                      ? '0 3px 6px rgba(0,0,0,0.5), inset 0 1px 1.2px rgba(255,255,255,0.85), inset 0 -1.5px 1.5px rgba(0,0,0,0.25)'
                      : '0 3px 6px rgba(0,0,0,0.2), inset 0 1.2px 1.5px rgba(255,255,255,0.95), inset 0 -1px 1px rgba(0,0,0,0.12)',
                    background: isDarkBg 
                      ? 'linear-gradient(to bottom, #eeeeee, #b6b9bf)' 
                      : 'linear-gradient(to bottom, #ffffff, #d9dcde)'
                  }}
                >
                  {/* Slightly recessed tactile center */}
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{
                      boxShadow: isDarkBg 
                        ? 'inset 0 1.5px 2.5px rgba(0,0,0,0.4), 0 0.5px 0.5px rgba(255,255,255,0.6)'
                        : 'inset 0 1px 2px rgba(0,0,0,0.2), 0 0.5px 0.5px rgba(255,255,255,0.85)',
                      background: isDarkBg
                        ? 'linear-gradient(to bottom, #9ea0a5, #e4e6eb)'
                        : 'linear-gradient(to bottom, #bdbfc4, #f4f5f7)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Elapsed / Remaining time aligned naturally on each side */}
            <div className="flex items-center justify-between mt-0.5 text-[10px] font-mono font-semibold text-[var(--text-tertiary)] select-none">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
            </div>
          </div>

          {/* Luxury iPod Click-Wheel Controller */}
          <div className="flex items-center justify-center" style={{ marginTop: 'min(18px, 2.8vh)' }}>
            <div 
              className="relative rounded-full flex items-center justify-center select-none now-playing-wheel"
              style={{
                background: isDarkBg 
                  ? 'radial-gradient(circle at 50% 20%, #2e2f38 0%, #1e1e24 70%, #131318 100%)' 
                  : 'radial-gradient(circle at 50% 20%, #ffffff 0%, #edf0f5 70%, #dcdfe6 100%)',
                boxShadow: isDarkBg 
                  ? 'inset 0 2px 4px rgba(255,255,255,0.07), inset 0 -4px 10px rgba(0,0,0,0.55), 0 15px 35px rgba(0,0,0,0.65)' 
                  : 'inset 0 2px 5px rgba(255,255,255,0.95), inset 0 -4px 10px rgba(0,0,0,0.1), 0 15px 30px rgba(0,0,0,0.06)',
                border: isDarkBg ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.05)'
              }}
            >
              {/* Polished outer highlight edge */}
              <div className={`absolute inset-1.5 rounded-full pointer-events-none ${
                isDarkBg ? 'border border-white/[0.02]' : 'border border-white/40'
              }`} />

              {/* TOP: Repeat (Toggles mode) */}
              <button 
                onClick={(e) => { e.stopPropagation(); toggleRepeatMode(); }}
                className={`absolute top-[6%] left-1/2 -translate-x-1/2 p-2 rounded-full transition-all duration-300 flex flex-col items-center cursor-pointer z-10 ${
                  repeatMode !== 'none' 
                    ? 'text-[var(--accent)] drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] scale-110 font-bold' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105'
                }`}
                title="Repeat Mode"
              >
                <Repeat size={18} className={repeatMode !== 'none' ? "stroke-[2.5]" : "stroke-2"} />
                {repeatMode === 'one' && (
                  <span className="text-[7px] font-bold font-mono tracking-tighter absolute bottom-0.5">1</span>
                )}
              </button>

              {/* RIGHT: Next Track */}
              <button 
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-[6%] top-1/2 -translate-y-1/2 p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer z-10"
                title="Next Track"
              >
                <SkipForward size={20} fill="currentColor" className="stroke-0" />
              </button>

              {/* BOTTOM: Shuffle */}
              <button 
                onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                className={`absolute bottom-[6%] left-1/2 -translate-x-1/2 p-2 rounded-full transition-all duration-300 cursor-pointer z-10 ${
                  shuffle 
                    ? 'text-[var(--accent)] drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] scale-110 font-bold' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105'
                }`}
                title="Shuffle Mode"
              >
                <Shuffle size={18} className={shuffle ? "stroke-[2.5]" : "stroke-2"} />
              </button>

              {/* LEFT: Previous Track */}
              <button 
                onClick={(e) => { e.stopPropagation(); previous(); }}
                className="absolute left-[6%] top-1/2 -translate-y-1/2 p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer z-10"
                title="Previous Track"
              >
                <SkipBack size={20} fill="currentColor" className="stroke-0" />
              </button>

              {/* Donut-Shaped Center Recessed Cavity (Machined inside the wheel) */}
              <div 
                className="absolute w-[40%] h-[40%] rounded-full flex items-center justify-center overflow-hidden pointer-events-none"
                style={{
                  background: isDarkBg
                    ? 'radial-gradient(circle at 50% 10%, #15151b 0%, #0d0d11 100%)'
                    : 'radial-gradient(circle at 50% 10%, #e2e5eb 0%, #cfd2da 100%)',
                  boxShadow: isDarkBg
                    ? 'inset 0 4px 10px rgba(0, 0, 0, 0.95), inset 0 -2px 3px rgba(255, 255, 255, 0.05), 0 1px 1px rgba(255, 255, 255, 0.08)'
                    : 'inset 0 4px 8px rgba(0, 0, 0, 0.22), inset 0 -2px 3px rgba(255, 255, 255, 0.75), 0 1px 1px rgba(255, 255, 255, 1)'
                }}
              />

              {/* CENTER: Play / Pause Button sitting naturally inside the recessed cavity */}
              <motion.button 
                onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }}
                className="absolute w-[36%] h-[36%] rounded-full flex items-center justify-center cursor-pointer select-none border-none outline-none z-10"
                style={{
                  background: isDarkBg 
                    ? 'radial-gradient(circle at 50% 15%, #1d1e24 0%, #121217 100%)' 
                    : 'radial-gradient(circle at 50% 15%, #f4f6fa 0%, #e1e4eb 100%)',
                  boxShadow: isDarkBg 
                    ? 'inset 0 1px 2px rgba(255, 255, 255, 0.07), inset 0 -2px 4px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.45)' 
                    : 'inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -2px 4px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)'
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ 
                  y: 1,
                  scale: 0.97,
                  boxShadow: isDarkBg 
                    ? 'inset 0 2px 4px rgba(0,0,0,0.8), inset 0 -1px 1px rgba(255,255,255,0.02)' 
                    : 'inset 0 2px 4px rgba(0,0,0,0.15), inset 0 -1px 1px rgba(255,255,255,0.6)'
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <div className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors duration-200">
                  {isPlaying ? (
                    <Pause size={18} fill="currentColor" className="stroke-0" />
                  ) : (
                    <Play size={18} fill="currentColor" className="ml-1 stroke-0" />
                  )}
                </div>
              </motion.button>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE: Playlist display (Only visible on landscape tablet and desktop) */}
        {isLandscapeTabletOrDesktop && (
          <div className="flex w-[320px] lg:w-[380px] xl:w-[440px] shrink-0 flex-col h-full pl-8 lg:pl-10 border-l border-[var(--border)] overflow-hidden">
            
            {/* Header row */}
            <div className="flex items-center justify-between mb-4 shrink-0 select-none">
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Up Next
              </h3>
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono font-bold uppercase tracking-widest bg-[var(--bg-elevated)] px-2.5 py-0.5 rounded border border-white/5">
                {queue.length} Tracks
              </span>
            </div>

            {/* Interactive list container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 no-scrollbar scroll-smooth">
              {queue.map((track, idx) => {
                const isCurrent = currentTrack.id === track.id;
                return (
                  <div 
                    key={`${track.id}-${idx}`}
                    onClick={() => handlePlayTrackFromQueue(track)}
                    className={`flex items-center gap-4 p-3 rounded transition-all duration-300 cursor-pointer group select-none border-l-2 ${
                      isCurrent 
                        ? 'bg-[var(--accent)]/10 border-[var(--accent)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                        : 'border-transparent hover:bg-white/[0.03] dark:hover:bg-white/[0.02] hover:pl-4'
                    }`}
                  >
                    {/* Thumbnail cover jacket */}
                    <div className="w-10 h-10 rounded-none bg-zinc-850 overflow-hidden shrink-0 shadow-md relative">
                      {track.coverUrl ? (
                        <CoverArtImage src={track.coverUrl} className="" wrapperClassName="w-full h-full" fallbackClassName="bg-[var(--bg-elevated)]" alt="" />
                      ) : (
                        <div className="w-full h-full bg-zinc-800" />
                      )}
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-0.5 bg-[var(--accent)] animate-[bounce_1s_infinite_100ms] h-full" />
                            <span className="w-0.5 bg-[var(--accent)] animate-[bounce_1s_infinite_300ms] h-[60%]" />
                            <span className="w-0.5 bg-[var(--accent)] animate-[bounce_1s_infinite_500ms] h-[80%]" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meta metadata details */}
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-primary)]'}`}>
                        {track.title}
                      </h4>
                      <p className="text-[10px] text-[var(--text-tertiary)] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>

                    {/* Duration stamp */}
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                      {formatTime(track.duration)}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </motion.div>
  );
};
