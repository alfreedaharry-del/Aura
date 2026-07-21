import React from 'react';
import { useLibraryStore } from '../store/useLibraryStore';
import { useActivePlayer } from '../store/usePlayerStore';
import { Play, Heart, Disc3, Clock, Database, ListMusic } from 'lucide-react';
import { motion } from 'motion/react';
import { RecordPlayer } from '../components/RecordPlayer';
import { LibraryInsightsNetwork } from '../components/LibraryInsightsNetwork';
import { CoverArtImage } from '../lib/coverArt';

const Equalizer: React.FC = () => {
  return (
    <div className="flex items-end gap-0.5 h-3.5 w-3.5">
      <motion.div 
        animate={{ height: ["20%", "100%", "20%"] }} 
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        className="w-1 bg-[var(--accent)] rounded-full"
      />
      <motion.div 
        animate={{ height: ["40%", "100%", "40%"] }} 
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
        className="w-1 bg-[var(--accent)] rounded-full"
      />
      <motion.div 
        animate={{ height: ["15%", "100%", "15%"] }} 
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        className="w-1 bg-[var(--accent)] rounded-full"
      />
    </div>
  );
};

export const HomeView: React.FC = () => {
  const tracks = useLibraryStore(s => s.tracks);
  
  // Use our synchronized custom active player hook!
  const { 
    currentTrack, 
    queue, 
    queueIndex, 
    isPlaying, 
    playTrack, 
    pause, 
    resume 
  } = useActivePlayer();

  const recentlyAdded = [...tracks].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, 6);
  
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatFullDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb > 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };
  
  const favorites = tracks.filter(t => t.isFavorite).sort((a, b) => (a.customOrder || 0) - (b.customOrder || 0));
  const featuredTrack = favorites.length > 0 ? favorites[0] : (tracks.length > 0 ? tracks[0] : null);
  const activeTrack = currentTrack || featuredTrack;
  
  // Centralized active playlist/queue: falls back to full library if empty
  const activeQueue = queue.length > 0 ? queue : tracks;
  const activeIndex = currentTrack 
    ? activeQueue.findIndex(t => t.id === currentTrack.id) 
    : (featuredTrack ? activeQueue.findIndex(t => t.id === featuredTrack.id) : -1);

  const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0);
  const totalSize = tracks.reduce((acc, t) => acc + (t.fileSize || 0), 0);
  const favoriteCount = favorites.length;
  const uniqueArtists = new Set(tracks.map(t => t.artist)).size;
  const uniqueAlbums = new Set(tracks.map(t => t.album)).size;
  const playlistCount = useLibraryStore.getState().playlists.length;
  const recentCount = recentlyAdded.length;

  const StatCard = ({ icon: Icon, label, value, subvalue }: { icon: any, label: string, value: string | number, subvalue?: string }) => (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-panel p-6 rounded-[2rem] flex flex-col items-center text-center group transition-all duration-300 hover:shadow-2xl hover:shadow-[var(--accent)]/5 border border-white/5"
    >
      <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mb-4 text-[var(--accent)] group-hover:scale-110 transition-transform shadow-inner">
        <Icon size={22} />
      </div>
      <p className="text-[var(--text-tertiary)] text-[10px] font-bold tracking-[0.2em] uppercase mb-2">{label}</p>
      <h3 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-1">{value}</h3>
      {subvalue && <p className="text-[var(--text-secondary)] text-xs font-medium opacity-60">{subvalue}</p>}
    </motion.div>
  );

  return (
    <div className="p-4 md:p-8 pb-32 h-full overflow-y-auto scrollbar-thin">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {tracks.length === 0 ? (
          <div className="text-center py-20 px-6 border border-dashed border-[var(--border)] rounded-2xl glass-panel">
            <h2 className="text-xl font-medium mb-2">Your library is empty</h2>
            <p className="text-[var(--text-tertiary)] mb-6">No supported music files were found.</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => useLibraryStore.getState().loadLibrary()} className="px-6 py-3 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all font-medium">Reload</button>
            </div>
          </div>
        ) : (
          <div className="space-y-10 sm:space-y-12 md:space-y-16">
            
            {/* Live Record Player and Active Playlist Grid */}
            {activeTrack && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
                
                {/* Left: Beautiful Floating Record Player */}
                <div className="lg:col-span-6 flex flex-col items-center text-center p-4">
                  <div className="relative">
                    <RecordPlayer audioPath={activeTrack.filePath} isPlaying={isPlaying && currentTrack?.id === activeTrack.id} />
                  </div>
                  
                  {/* Meta Details & Actions */}
                  <div className="mt-8 flex flex-col items-center">
                    <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-[var(--accent)] mb-2">
                      {currentTrack ? 'Now Playing' : 'Ready to Spin'}
                    </span>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold tracking-tight text-[var(--text-primary)] mb-1.5 px-4 leading-tight">
                      {activeTrack.title}
                    </h1>
                    <p className="text-sm sm:text-base text-[var(--text-secondary)] font-medium mb-5 px-4 leading-relaxed">
                      {activeTrack.artist} {activeTrack.album ? `• ${activeTrack.album}` : ''}
                    </p>
                    
                    {/* Floating Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (currentTrack && currentTrack.id === activeTrack.id) {
                            isPlaying ? pause() : resume();
                          } else {
                            playTrack(activeTrack, activeQueue);
                          }
                        }}
                        className="px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-base)] font-bold text-xs sm:text-sm hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
                      >
                        {isPlaying && currentTrack?.id === activeTrack.id ? (
                          <>
                            <span className="text-[10px] sm:text-xs">⏸</span>
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play size={12} fill="currentColor" />
                            <span>Play</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          useLibraryStore.getState().toggleFavorite(activeTrack.id);
                        }}
                        className={`p-2.5 rounded-full border border-[var(--border)] transition-colors hover:bg-[var(--bg-elevated)] ${activeTrack.isFavorite ? 'text-red-500 border-red-500/20' : 'text-[var(--text-tertiary)]'}`}
                      >
                        <Heart size={16} fill={activeTrack.isFavorite ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Right: Entire Active Playlist showing all tracks */}
                <div className="lg:col-span-6 flex flex-col h-[400px] sm:h-[450px] lg:h-[500px] glass-panel rounded-3xl border border-[var(--border)] bg-[var(--bg-panel)] overflow-hidden shadow-xl">
                  <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-elevated)]/30">
                    <div className="flex flex-col text-left">
                      <h3 className="text-sm font-bold tracking-[0.05em] text-[var(--text-primary)]">Active Playlist</h3>
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase font-mono font-bold tracking-wider mt-0.5">
                        {activeQueue.length} Tracks • {currentTrack ? `Track ${activeIndex + 1}` : 'Not started'}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono bg-[var(--bg-elevated)] border border-[var(--border)] px-2.5 py-1 rounded-full text-[var(--text-tertiary)] uppercase font-bold tracking-wider">
                      Entire List
                    </span>
                  </div>
                  
                  {/* Playlist Queue list */}
                  <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]/30 scrollbar-thin p-3 space-y-1">
                    {activeQueue.map((track, i) => {
                      const isCurrent = activeTrack && track.id === activeTrack.id;
                      return (
                        <div 
                          key={track.id + '-' + i}
                          onDoubleClick={() => playTrack(track, activeQueue)}
                          onClick={() => playTrack(track, activeQueue)}
                          className={`group flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-300 relative ${
                            isCurrent 
                              ? 'bg-[var(--bg-elevated)] border border-[var(--accent)]/40 shadow-md shadow-[var(--accent)]/5' 
                              : 'hover:bg-[var(--bg-elevated)] border border-transparent'
                          }`}
                        >
                          {/* Left Glow Indicator strip */}
                          {isCurrent && (
                            <div className="absolute left-0 top-3 bottom-3 w-1 bg-[var(--accent)] rounded-r-md" />
                          )}
                          
                          {/* Index / Equalizer Indicator */}
                          <div className="w-6 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                            {isCurrent && isPlaying ? (
                              <Equalizer />
                            ) : (
                              <span className={isCurrent ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}>
                                {(i + 1).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>

                          {/* Thumbnail Cover */}
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--bg-elevated)] shrink-0 relative border border-[var(--border)]">
                            {track.coverUrl ? (
                              <CoverArtImage src={track.coverUrl} className="" wrapperClassName="w-full h-full" fallbackClassName="bg-[var(--bg-elevated)]" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Disc3 size={16} className="text-[var(--text-tertiary)] opacity-30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play size={12} fill="white" className="text-white" />
                            </div>
                          </div>

                          {/* Title & Artist */}
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`font-bold text-sm truncate transition-colors ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                              {track.title}
                            </p>
                            <p className="text-[10px] text-[var(--text-secondary)] font-medium truncate uppercase tracking-wider mt-0.5">
                              {track.artist}
                            </p>
                          </div>

                          {/* Favorite button */}
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              useLibraryStore.getState().toggleFavorite(track.id); 
                            }}
                            className={`p-1.5 rounded-full transition-colors ${track.isFavorite ? 'text-red-500 animate-pulse-subtle' : 'text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)]'}`}
                          >
                            <Heart size={14} fill={track.isFavorite ? "currentColor" : "none"} />
                          </button>

                          {/* Duration */}
                          <div className="text-right text-[11px] font-mono text-[var(--text-tertiary)] shrink-0 w-12">
                            {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* Recently Added Section */}
            <section>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold font-display">Recently Added</h2>
                <span className="text-[10px] sm:text-xs font-bold text-[var(--text-tertiary)] tracking-widest uppercase">{tracks.length} Tracks Total</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-8">
                {recentlyAdded.map((track, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    key={track.id} 
                    className="group cursor-pointer max-w-[220px] mx-auto w-full"
                    onClick={() => playTrack(track, tracks)}
                  >
                    <div className="relative aspect-square rounded-2xl md:rounded-[2.5rem] overflow-hidden mb-4 shadow-sm group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-1">
                      {track.coverUrl ? (
                        <CoverArtImage src={track.coverUrl} className="transform group-hover:scale-110 transition-transform duration-700 ease-out" wrapperClassName="w-full h-full" fallbackClassName="bg-[var(--bg-elevated)]" />
                      ) : (
                        <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                          <Disc3 size={32} className="text-[var(--text-tertiary)] opacity-30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-300 text-white shadow-lg border border-white/30">
                          <Play fill="currentColor" size={24} className="ml-1" />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-[var(--text-primary)] text-sm truncate mb-0.5 px-2">{track.title}</h3>
                    <div className="flex items-center justify-between px-2">
                      <p className="text-[10px] font-medium text-[var(--text-secondary)] truncate uppercase tracking-wider">{track.artist}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); useLibraryStore.getState().toggleFavorite(track.id); }}
                        className={`p-1 rounded-full transition-colors ${track.isFavorite ? 'text-red-500' : 'text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)]'}`}
                      >
                        <Heart size={14} fill={track.isFavorite ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Library Insights Section: Redesigned into Premium Connected Node Visualization */}
            <section className="pt-8 border-t border-[var(--border)]">
              <div className="mb-8">
                <h2 className="text-2xl font-bold font-display mb-2">Library Insights</h2>
                <p className="text-sm text-[var(--text-secondary)] font-medium">An organic, connected view of your musical universe.</p>
              </div>
              <LibraryInsightsNetwork
                totalTracks={tracks.length}
                uniqueArtists={uniqueArtists}
                uniqueAlbums={uniqueAlbums}
                playlistCount={playlistCount}
                totalDurationStr={formatDuration(totalDuration)}
                totalSizeStr={formatSize(totalSize)}
                favoriteCount={favoriteCount}
                recentCount={recentCount}
              />
            </section>

          </div>
        )}
      </motion.div>
    </div>
  );
};
