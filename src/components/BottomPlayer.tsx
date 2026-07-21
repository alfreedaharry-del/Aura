import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ListVideo, Repeat, Shuffle } from 'lucide-react';
import { usePlayerStore, useActivePlayer } from '../store/usePlayerStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { engine } from '../lib/audioEngine';
import { motion, AnimatePresence } from 'motion/react';

interface BottomPlayerProps {
  hideTrackInfo?: boolean;
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({ hideTrackInfo = false }) => {
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
    setNowPlayingOpen
  } = useActivePlayer();
  const { volume, setVolume } = useSettingsStore();

  const [showMobileVolume, setShowMobileVolume] = useState(false);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetVolumeTimeout = () => {
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    volumeTimeoutRef.current = setTimeout(() => {
      setShowMobileVolume(false);
    }, 3000);
  };

  useEffect(() => {
    if (showMobileVolume) {
      resetVolumeTimeout();
    } else if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
  }, [showMobileVolume]);

  useEffect(() => {
    return () => {
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current);
      }
    };
  }, []);

  if (!currentTrack) return null;

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    engine.seek(Number(e.target.value));
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    engine.setVolume(val);
  };

  return (
    <>
      {/* Outside Click / Tap Dismissal Overlay for Mobile Volume */}
      <AnimatePresence>
        {showMobileVolume && (
          <div 
            className="fixed inset-0 z-40 md:hidden bg-transparent" 
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileVolume(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Desktop/Tablet Mini Player Layout */}
      <div 
        onClick={() => setNowPlayingOpen(true)}
        className="hidden md:flex h-20 border-t border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-xl items-center px-6 gap-6 relative z-50 cursor-pointer hover:bg-[var(--bg-elevated)]/35 active:bg-[var(--bg-elevated)]/50 transition-colors duration-200 select-none"
      >
        {/* Progress Bar (Absolute top) */}
        <div className="absolute top-0 left-0 w-full h-1 group cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <input 
            type="range" 
            min={0} 
            max={duration || 100} 
            value={currentTime} 
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="w-full h-0.5 bg-[var(--border)] group-hover:h-1.5 transition-all">
            <div 
              className="h-full bg-[var(--accent)] relative"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--accent)] opacity-0 group-hover:opacity-100 shadow-md transform translate-x-1/2" />
            </div>
          </div>
        </div>

        {/* Track Info */}
        {!hideTrackInfo ? (
          <div className="flex items-center gap-4 w-1/3 min-w-0">
            <div className="w-12 h-12 rounded shadow-sm overflow-hidden bg-[var(--bg-elevated)] flex-shrink-0">
              {currentTrack.coverUrl ? (
                 <img src={currentTrack.coverUrl} loading="lazy" decoding="async" className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              ) : (
                 <div className="w-full h-full bg-[var(--bg-elevated)]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{currentTrack.title}</p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">{currentTrack.artist}</p>
            </div>
          </div>
        ) : (
          <div className="w-1/3" />
        )}

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-6">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
              className={`transition-colors ${
                shuffle ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
              title="Shuffle"
            >
              <Shuffle size={18} className={shuffle ? "stroke-[2.5]" : "stroke-2"} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); previous(); }} 
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <SkipBack size={20} fill="currentColor" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }}
              className="w-10 h-10 rounded-full bg-[var(--text-primary)] text-[var(--bg-base)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); next(); }} 
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleRepeatMode(); }}
              className={`transition-colors flex items-center gap-0.5 relative ${
                repeatMode !== 'none' ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              <Repeat size={18} className={repeatMode !== 'none' ? "stroke-[2.5]" : "stroke-2"} />
              {repeatMode === 'one' && <span className="text-[8px] font-bold absolute translate-x-3.5 -translate-y-1 bg-[var(--accent)] text-[var(--bg-base)] w-3.5 h-3.5 rounded-full flex items-center justify-center scale-90">1</span>}
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] font-mono tracking-wider">
            <span>{formatTime(currentTime)}</span>
            <span className="text-[var(--border)]">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="w-1/3 flex items-center justify-end gap-4" onClick={(e) => e.stopPropagation()}>
          <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <ListVideo size={18} />
          </button>
          
          {/* Desktop/Tablet Volume Control */}
          <div className="hidden md:flex items-center gap-2 w-28 group">
            <Volume2 size={18} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
            <div className="relative flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
               <input 
                  type="range" 
                  min={0} max={1} step={0.01} 
                  value={volume} 
                  onChange={handleVolume}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute top-0 left-0 h-full bg-[var(--text-secondary)] group-hover:bg-[var(--accent)] transition-colors" style={{ width: `${volume * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Mobile Mini Player Layout */}
      <div 
        onClick={() => setNowPlayingOpen(true)}
        className="md:hidden h-20 border-t border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-xl flex items-center justify-between px-4 relative z-50 cursor-pointer hover:bg-[var(--bg-elevated)]/35 active:bg-[var(--bg-elevated)]/50 transition-colors duration-200 select-none"
      >
        {/* Progress Bar (Absolute top) */}
        <div className="absolute top-0 left-0 w-full h-0.5" onClick={(e) => e.stopPropagation()}>
          <div 
            className="h-full bg-[var(--accent)]"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        {/* Left Side: Track Info (No Artwork) */}
        <div className="flex-1 min-w-0 pr-12 flex flex-col justify-center">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{currentTrack.title}</p>
          <p className="text-xs text-[var(--text-tertiary)] truncate">{currentTrack.artist}</p>
        </div>

        {/* Center Side: Playback Controls (Mathematically Perfectly Centered) */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); previous(); }} 
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-all p-2"
          >
            <SkipBack size={18} fill="currentColor" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }}
            className="w-10 h-10 rounded-full bg-[var(--text-primary)] text-[var(--bg-base)] flex items-center justify-center active:scale-95 transition-all shadow-md"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); next(); }} 
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-all p-2"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>
        </div>

        {/* Right Side: Secondary Controls */}
        <div className="flex-1 flex items-center justify-end gap-1.5 pl-12" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
            className={`p-2 transition-colors ${
              shuffle ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
            title="Shuffle"
          >
            <Shuffle size={16} className={shuffle ? "stroke-[2.5]" : "stroke-2"} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileVolume(!showMobileVolume);
            }}
            className={`p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative z-50 cursor-pointer ${showMobileVolume ? 'text-[var(--accent)]' : ''}`}
            title="Volume"
          >
            <Volume2 size={18} />
          </button>
        </div>

        {/* Mobile Floating Volume Slider (Renders perfectly inside screen bounds) */}
        <AnimatePresence>
          {showMobileVolume && (
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="absolute bottom-24 right-4 bg-[var(--glass-bg)] border border-[var(--border)] backdrop-blur-2xl rounded-2xl p-4 shadow-2xl flex items-center gap-3 w-48 z-50"
              onClick={(e) => {
                e.stopPropagation();
                resetVolumeTimeout();
              }}
            >
              <Volume2 size={16} className="text-[var(--text-primary)]" />
              <div className="relative flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <input 
                  type="range" 
                  min={0} max={1} step={0.01} 
                  value={volume} 
                  onChange={(e) => {
                    handleVolume(e);
                    resetVolumeTimeout();
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute top-0 left-0 h-full bg-[var(--accent)]" style={{ width: `${volume * 100}%` }} />
              </div>
              <span className="text-[10px] font-mono text-[var(--text-secondary)] w-6 text-right">
                {Math.round(volume * 100)}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
