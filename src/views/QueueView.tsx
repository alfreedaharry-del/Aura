import React from 'react';
import { useActivePlayer } from '../store/usePlayerStore';
import { Play, Disc3, Clock, Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const QueueView: React.FC = () => {
  const { queue, queueIndex, currentTrack, playTrack, isPlaying, pause, resume } = useActivePlayer();

  const handlePlayQueueTrack = (index: number) => {
    const track = queue[index];
    if (track) {
      playTrack(track, queue);
    }
  };

  const upcomingTracks = queue.slice(queueIndex + 1);

  return (
    <div className="h-full overflow-y-auto pb-32 pt-6 px-4 sm:px-6 md:px-8 bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-1">Play Queue</h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Manage your playback queue and see what plays next.</p>
        </div>

        {/* Now Playing master card */}
        {currentTrack ? (
          <div className="glass-panel p-4 sm:p-6 rounded-[2rem] border border-white/5 bg-[var(--bg-panel)] relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/10 to-transparent pointer-events-none" />
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3 flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                {isPlaying && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                )}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
              </span>
              {isPlaying ? 'Now Playing' : 'Last Played'}
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[var(--bg-elevated)] shrink-0 shadow-lg border border-white/10">
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Disc3 className="text-[var(--text-tertiary)] opacity-30 animate-spin" size={24} style={{ animationDuration: '8s' }} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate">{currentTrack.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{currentTrack.artist}</p>
                <p className="text-[10px] font-mono text-[var(--text-tertiary)] mt-1.5">{currentTrack.album || 'Unknown Album'}</p>
              </div>
              <button
                onClick={isPlaying ? pause : resume}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-base)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
              >
                {isPlaying ? <span className="text-sm font-bold">⏸</span> : <Play size={16} fill="currentColor" className="ml-1 text-[var(--bg-base)]" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 glass-panel rounded-[2rem] border border-dashed border-[var(--border)]">
            <Disc3 className="mx-auto text-[var(--text-tertiary)] opacity-40 mb-3" size={40} />
            <p className="text-sm text-[var(--text-secondary)]">No song loaded. Select a track to start playing!</p>
          </div>
        )}

        {/* Up Next List */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display flex items-center gap-2">
              Up Next <span className="text-xs font-mono font-medium text-[var(--text-tertiary)]">({upcomingTracks.length} songs)</span>
            </h2>
          </div>

          {upcomingTracks.length > 0 ? (
            <div className="space-y-2">
              {upcomingTracks.map((track, relativeIndex) => {
                const actualIndex = queueIndex + 1 + relativeIndex;
                return (
                  <motion.div
                    key={track.id + '-' + actualIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(6, relativeIndex) * 0.05 }}
                    onClick={() => handlePlayQueueTrack(actualIndex)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[var(--bg-elevated)] cursor-pointer group transition-all border border-transparent hover:border-white/5"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--bg-elevated)] shrink-0 relative">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc3 size={16} className="text-[var(--text-tertiary)] opacity-30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                        <Play size={14} fill="white" className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm truncate text-[var(--text-primary)]">{track.title}</p>
                      <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] truncate">{track.artist}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] sm:text-xs font-mono text-[var(--text-tertiary)]">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-[1.5rem] text-center border border-[var(--border)]">
              <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">Queue is empty. It will auto-populate from your current playlist context.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
