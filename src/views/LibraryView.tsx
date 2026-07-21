import React, { useState, useRef, useEffect } from 'react';
import { useLibraryStore } from '../store/useLibraryStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { Play, Search, LayoutGrid, List, Heart, Disc3, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track } from '../types';
import { CoverArtImage } from '../lib/coverArt';

export const LibraryView: React.FC = () => {
  const tracks = useLibraryStore(s => s.tracks);
  const playlists = useLibraryStore(s => s.playlists);
  const playTrack = usePlayerStore(s => s.playTrack);
  const setNowPlayingOpen = usePlayerStore(s => s.setNowPlayingOpen);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearchModal) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showSearchModal]);

  const filteredTracks = tracks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Search results query for the central library (Song Title, Artist, Album, Playlist name)
  const searchResults = searchQuery.trim() === '' ? [] : tracks.filter(track => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = track.title.toLowerCase().includes(query);
    const matchesArtist = track.artist.toLowerCase().includes(query);
    const matchesAlbum = track.album.toLowerCase().includes(query);
    
    // Check if the track belongs to any playlist matching the query
    const matchesPlaylist = playlists.some(p => 
      p.name.toLowerCase().includes(query) && p.trackIds.includes(track.id)
    );
    
    return matchesTitle || matchesArtist || matchesAlbum || matchesPlaylist;
  });

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 md:p-8 pb-0 md:pb-0 h-full flex flex-col overflow-hidden">
      {/* Mobile Header (repositioned to not overlap hamburger, with inline search replaced by clean icon) */}
      <div className="flex flex-col md:hidden flex-shrink-0 mb-4 border-b border-[var(--border)]/30 pb-4">
        <div className="flex items-center justify-between pt-4 pl-20 pr-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">Library</h1>
            <button 
              onClick={() => setShowSearchModal(true)}
              className="p-2.5 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer flex items-center justify-center border border-[var(--border)]/10"
              id="mobile-search-trigger"
            >
              <Search size={18} />
            </button>
          </div>
          <div className="flex items-center bg-[var(--bg-elevated)] rounded-full p-1 border border-[var(--border)] scale-90">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-[var(--accent)] text-[var(--bg-base)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
            >
              <List size={14} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-[var(--accent)] text-[var(--bg-base)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
        
        {/* Compact Search Indicator (Mobile) */}
        {!showSearchModal && searchQuery.trim() !== '' && (
          <div className="mx-4 mt-3 flex items-center bg-[var(--bg-elevated)]/50 border border-[var(--border)] rounded-xl px-3 py-1.5 shadow-sm">
            <Search size={14} className="text-[var(--text-tertiary)] flex-shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none text-xs font-medium text-[var(--text-primary)] focus:outline-none min-w-0"
              placeholder="Search..."
            />
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full hover:bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex-shrink-0 transition-colors ml-2"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between mb-8 flex-shrink-0">
        <h1 className="text-3xl font-display font-bold">Library</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={16} />
            <input 
              type="text" 
              placeholder="Search library..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all w-64 text-[var(--text-primary)]"
            />
          </div>
          <div className="flex items-center bg-[var(--bg-elevated)] rounded-full p-1 border border-[var(--border)]">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-[var(--accent)] text-[var(--bg-base)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-[var(--accent)] text-[var(--bg-base)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 md:pr-4 -mr-2 md:-mr-4 scrollbar-thin">
        {tracks.length === 0 ? (
          <div className="text-center py-20 px-6 border border-dashed border-[var(--border)] rounded-2xl glass-panel mt-4">
            <h2 className="text-xl font-medium mb-2">No Music Found</h2>
            <p className="text-[var(--text-tertiary)] mb-6">No supported music files were found.</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => useLibraryStore.getState().loadLibrary()} className="px-6 py-3 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all font-medium">Reload</button>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="w-full">
            <div className="space-y-1">
              {filteredTracks.map((track, i) => (
                <div 
                  key={track.id} 
                  onClick={() => playTrack(track, filteredTracks)}
                  className="flex items-center px-2 md:px-4 py-2.5 hover:bg-[var(--bg-elevated)]/60 active:bg-[var(--bg-elevated)] rounded-xl transition-colors group cursor-pointer"
                >
                  <div className="w-8 md:w-12 text-center text-xs md:text-sm text-[var(--text-tertiary)]">
                    {i + 1}
                  </div>
                  <div className="flex-1 flex items-center gap-2 md:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded shadow-sm overflow-hidden bg-[var(--bg-base)] flex-shrink-0 relative">
                      {track.coverUrl ? (
                        <CoverArtImage src={track.coverUrl} className="" wrapperClassName="w-full h-full" fallbackClassName="bg-[var(--bg-elevated)]" />
                      ) : (
                        <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-tertiary)] opacity-30">
                          <Disc3 size={16} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{track.title}</p>
                      <p className="text-xs text-[var(--text-secondary)] truncate">{track.artist}</p>
                    </div>
                  </div>
                  <div className="flex-1 hidden md:block text-sm text-[var(--text-secondary)] truncate px-4">
                    {track.album}
                  </div>
                  <div className="w-10 md:w-16 flex items-center justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); useLibraryStore.getState().toggleFavorite(track.id); }}
                      className={`p-2 rounded-full transition-colors ${track.isFavorite ? 'text-red-500' : 'text-[var(--text-tertiary)] md:opacity-0 md:group-hover:opacity-100 hover:text-[var(--text-primary)]'}`}
                    >
                      <Heart size={16} fill={track.isFavorite ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="w-12 md:w-24 text-right text-xs md:text-sm text-[var(--text-tertiary)] font-mono">
                    {formatTime(track.duration)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-2">
            {filteredTracks.map((track, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i < 20 ? i * 0.02 : 0 }}
                key={track.id} 
                className="group cursor-pointer max-w-[220px] mx-auto w-full"
                onClick={() => playTrack(track, filteredTracks)}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-md group-hover:shadow-2xl transition-all duration-400 group-hover:-translate-y-1">
                  {track.coverUrl ? (
                    <CoverArtImage src={track.coverUrl} className="transform group-hover:scale-110 transition-transform duration-700 ease-out" wrapperClassName="w-full h-full" fallbackClassName="bg-[var(--bg-elevated)]" />
                  ) : (
                    <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                      <Disc3 size={32} className="text-[var(--text-tertiary)] opacity-30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white shadow-xl border border-white/40 transform scale-75 group-hover:scale-100 transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)">
                      <Play fill="currentColor" size={26} className="ml-1" />
                    </div>
                  </div>
                </div>
                <h3 className="font-medium text-[var(--text-primary)] text-sm truncate px-1">{track.title}</h3>
                <div className="flex items-center justify-between mt-0.5 px-1">
                  <p className="text-xs text-[var(--text-secondary)] truncate">{track.artist}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); useLibraryStore.getState().toggleFavorite(track.id); }}
                    className={`p-1 rounded-full backdrop-blur-md transition-colors ${track.isFavorite ? 'text-red-500' : 'text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)]'}`}
                  >
                    <Heart size={14} fill={track.isFavorite ? "currentColor" : "none"} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Premium Centered Search Overlay/Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 bg-black/75 backdrop-blur-lg flex items-start justify-center pt-20 px-4 pb-20"
          >
            {/* Click outside to close */}
            <div className="absolute inset-0 cursor-default" onClick={() => setShowSearchModal(false)} />
            
            {/* Search Panel Card */}
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-[var(--bg-elevated)]/95 border border-[var(--border)] rounded-3xl shadow-2xl flex flex-col max-h-[75vh] overflow-hidden z-10"
            >
              <div className="p-4 border-b border-[var(--border)]/30 flex items-center justify-between gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={18} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search title, artist, album, playlist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-[var(--text-primary)]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Search results */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {searchQuery.trim() === '' ? (
                  <div className="text-center py-12 text-[var(--text-tertiary)] select-none">
                    <Search className="mx-auto mb-3 opacity-20" size={32} />
                    <p className="text-sm font-medium">Search central library</p>
                    <p className="text-xs mt-1 opacity-70">Find songs, artists, albums, and playlists</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-tertiary)] select-none">
                    <p className="text-sm font-semibold">No matches found</p>
                    <p className="text-xs mt-1 opacity-70">Double check spelling or try another term</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider px-2 mb-2 select-none">Matches ({searchResults.length})</p>
                    {searchResults.map((track) => {
                      const containingPlaylists = playlists.filter(p => 
                        p.trackIds.includes(track.id) && p.name.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      
                      return (
                        <div
                          key={track.id}
                          onClick={() => {
                            playTrack(track, tracks);
                            setNowPlayingOpen(true);
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-elevated)] rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98] group"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--bg-base)] flex-shrink-0 flex items-center justify-center border border-[var(--border)]/40 relative">
                            {track.coverUrl ? (
                              <CoverArtImage src={track.coverUrl} className="" wrapperClassName="w-full h-full" fallbackClassName="bg-[var(--bg-base)]" />
                            ) : (
                              <Disc3 size={16} className="text-[var(--text-tertiary)] opacity-40" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{track.title}</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs text-[var(--text-secondary)] truncate">{track.artist}</p>
                              <span className="text-[10px] text-[var(--text-tertiary)] opacity-40">•</span>
                              <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[120px]">{track.album}</p>
                              {containingPlaylists.length > 0 && (
                                <span className="text-[9px] bg-[var(--accent)]/10 text-[var(--accent)] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1">
                                  {containingPlaylists[0].name}
                                </span>
                              )}
                            </div>
                          </div>
                          <Play size={14} className="text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
