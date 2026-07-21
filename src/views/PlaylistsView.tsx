import React, { useState, useMemo, useEffect } from 'react';
import { useLibraryStore } from '../store/useLibraryStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { 
  Play, 
  Heart, 
  Search, 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  Trash2, 
  Edit3, 
  MoreVertical, 
  Plus, 
  ArrowLeft, 
  Check, 
  Music, 
  FolderDown,
  X,
  Disc3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track } from '../types';
import { CoverArtImage } from '../lib/coverArt';

export const PlaylistsView: React.FC = () => {
  const { tracks, directories, playlists, loadLibrary, toggleFavorite } = useLibraryStore();
  const playTrack = usePlayerStore(s => s.playTrack);
  const setNowPlayingOpen = usePlayerStore(s => s.setNowPlayingOpen);

  // Path tracking state (e.g., "/" or "/Rock" or "/Rock/Classic")
  const [currentPath, setCurrentPath] = useState<string>("/");
  
  // Search and selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  
  // Dialog / Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [folderToRename, setFolderToRename] = useState<string | null>(null);
  
  // Confirmation states
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [isFolderNotEmptyWarning, setIsFolderNotEmptyWarning] = useState(false);

  // Active dropdown folder item options
  const [activeMenuFolder, setActiveMenuFolder] = useState<string | null>(null);

  // Drag states
  const [isDraggingOverPath, setIsDraggingOverPath] = useState<string | null>(null);

  // Load latest filesystem updates on mount
  useEffect(() => {
    loadLibrary();
  }, []);

  // Helper to get direct subfolders of the current path
  const subfolders = useMemo(() => {
    return directories.filter(d => {
      if (d === currentPath) return false;
      if (currentPath === "/") {
        const parts = d.split('/').filter(Boolean);
        return parts.length === 1;
      } else {
        if (!d.startsWith(currentPath + "/")) return false;
        const subPart = d.substring(currentPath.length + 1);
        return !subPart.includes("/");
      }
    });
  }, [directories, currentPath]);

  // Helper to get tracks inside the current path
  const currentTracks = useMemo(() => {
    return tracks.filter(t => t.parentPath === currentPath);
  }, [tracks, currentPath]);

  // Filtered tracks based on search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery) return currentTracks;
    return currentTracks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentTracks, searchQuery]);

  const searchResults = useMemo(() => {
    if (searchQuery.trim() === '') return [];
    const query = searchQuery.toLowerCase();
    return tracks.filter(track => {
      const matchesTitle = track.title.toLowerCase().includes(query);
      const matchesArtist = track.artist.toLowerCase().includes(query);
      const matchesAlbum = track.album.toLowerCase().includes(query);
      
      const playlistsList = playlists;
      const containingPlaylists = playlistsList.filter(p => p.trackIds.includes(track.id));
      const matchesPlaylist = containingPlaylists.some(p => p.name.toLowerCase().includes(query));

      return matchesTitle || matchesArtist || matchesAlbum || matchesPlaylist;
    });
  }, [searchQuery, tracks, playlists]);

  useEffect(() => {
    if (showSearchModal) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showSearchModal]);

  // Build breadcrumbs array: e.g. ["/", "/Rock", "/Rock/Classic"]
  const breadcrumbs = useMemo(() => {
    if (currentPath === "/") return [{ name: "Root", path: "/" }];
    
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ name: "Root", path: "/" }];
    let accumulatedPath = "";
    
    parts.forEach(part => {
      accumulatedPath += "/" + part;
      crumbs.push({
        name: part,
        path: accumulatedPath
      });
    });
    
    return crumbs;
  }, [currentPath]);

  // Handle Create Playlist (Folder)
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch('/api/playlists/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentPath: currentPath, name: newFolderName.trim() })
      });
      if (res.ok) {
        setNewFolderName('');
        setIsCreateModalOpen(false);
        await loadLibrary();
      }
    } catch (err) {
      console.error("Failed to create folder", err);
    }
  };

  // Handle Rename Folder
  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim() || !folderToRename) return;

    try {
      const res = await fetch('/api/playlists/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: folderToRename, newName: renameValue.trim() })
      });
      if (res.ok) {
        setFolderToRename(null);
        setRenameValue('');
        setIsRenameModalOpen(false);
        await loadLibrary();
      }
    } catch (err) {
      console.error("Failed to rename folder", err);
    }
  };

  // Handle Delete Folder Action (initiates prompt or does deletion)
  const handleDeleteFolder = async (folderPath: string, force = false) => {
    try {
      const res = await fetch('/api/playlists/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath, force })
      });
      const data = await res.json();
      
      if (data.error === 'contains_items') {
        setFolderToDelete(folderPath);
        setIsFolderNotEmptyWarning(true);
        setIsConfirmDeleteOpen(true);
      } else if (res.ok) {
        setIsConfirmDeleteOpen(false);
        setFolderToDelete(null);
        setIsFolderNotEmptyWarning(false);
        await loadLibrary();
        
        // If we deleted the current folder, go up a level
        if (currentPath === folderPath || currentPath.startsWith(folderPath + "/")) {
          const parent = folderPath.substring(0, folderPath.lastIndexOf('/')) || "/";
          setCurrentPath(parent);
        }
      }
    } catch (err) {
      console.error("Failed to delete folder", err);
    }
  };

  // Multi-move Songs API call
  const moveTracks = async (trackIds: string[], targetPath: string) => {
    try {
      const res = await fetch('/api/songs/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songPaths: trackIds, targetFolderPath: targetPath })
      });
      if (res.ok) {
        setSelectedTrackIds([]);
        await loadLibrary();
      }
    } catch (err) {
      console.error("Failed to move tracks", err);
    }
  };

  // Move a playlist folder into another
  const movePlaylistFolder = async (sourceFolderPath: string, targetPath: string) => {
    if (sourceFolderPath === targetPath || targetPath.startsWith(sourceFolderPath + "/")) {
      // Cannot move folder inside itself
      return;
    }
    try {
      const res = await fetch('/api/playlists/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: sourceFolderPath, targetFolderPath: targetPath })
      });
      if (res.ok) {
        await loadLibrary();
      }
    } catch (err) {
      console.error("Failed to move playlist", err);
    }
  };

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, type: 'song' | 'folder', data: any) => {
    e.dataTransfer.effectAllowed = 'move';
    if (type === 'song') {
      // If the dragged song is part of multiselected list, move all selected tracks
      const tracksToMove = selectedTrackIds.includes(data.id) 
        ? selectedTrackIds 
        : [data.id];
      e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'song', ids: tracksToMove }));
    } else {
      e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folder', path: data.path }));
    }
  };

  const handleDragOver = (e: React.DragEvent, pathStr: string) => {
    e.preventDefault();
    setIsDraggingOverPath(pathStr);
  };

  const handleDragLeave = () => {
    setIsDraggingOverPath(null);
  };

  const handleDrop = async (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    setIsDraggingOverPath(null);
    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const data = JSON.parse(rawData);

      if (data.type === 'song') {
        await moveTracks(data.ids, targetPath);
      } else if (data.type === 'folder') {
        await movePlaylistFolder(data.path, targetPath);
      }
    } catch (err) {
      console.warn("Drop handling error", err);
    }
  };

  // Multi-selection management
  const toggleSelectTrack = (id: string) => {
    setSelectedTrackIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 md:p-8 pb-0 md:pb-0 h-full flex flex-col relative select-none overflow-hidden">
      {/* Mobile Header */}
      <div className="flex flex-col md:hidden flex-shrink-0 mb-4 border-b border-[var(--border)]/30 pb-4">
        <div className="flex items-start justify-between pt-4 pl-20 pr-4">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
              <span className="truncate">Playlist System</span>
            </div>
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center flex-wrap gap-1 text-base font-display font-semibold">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                const isOver = isDraggingOverPath === crumb.path;
                return (
                  <React.Fragment key={crumb.path}>
                    {idx > 0 && <ChevronRight size={14} className="text-[var(--text-tertiary)] opacity-60 flex-shrink-0" />}
                    <button
                      onClick={() => setCurrentPath(crumb.path)}
                      onDragOver={(e) => handleDragOver(e, crumb.path)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, crumb.path)}
                      className={`rounded transition-all duration-200 cursor-pointer truncate max-w-[120px] ${
                        isLast 
                          ? 'text-[var(--text-primary)] font-bold' 
                          : 'text-[var(--text-secondary)]'
                      } ${isOver ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : ''}`}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          
          <button 
            onClick={() => setShowSearchModal(true)}
            className="p-2.5 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer flex items-center justify-center border border-[var(--border)]/10 ml-2"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Global Controls (Mobile) */}
        <div className="flex items-center gap-2 px-4 mt-3 overflow-x-auto scrollbar-none pb-1">
          {currentPath !== "/" && (
            <>
              <button
                onClick={() => {
                  const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || "/";
                  setCurrentPath(parent);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-[var(--bg-panel)] transition-colors cursor-pointer flex-shrink-0"
              >
                <ArrowLeft size={14} />
                <span>Go Up</span>
              </button>
              
              <button
                onClick={() => {
                  setFolderToRename(currentPath);
                  const currentName = currentPath.split('/').pop() || '';
                  setRenameValue(currentName);
                  setIsRenameModalOpen(true);
                }}
                className="p-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors cursor-pointer flex-shrink-0"
              >
                <Edit3 size={14} />
              </button>

              <button
                onClick={() => handleDeleteFolder(currentPath)}
                className="p-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-colors cursor-pointer flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-[var(--bg-base)] rounded-full font-semibold shadow-sm text-xs flex-shrink-0"
          >
            <FolderPlus size={14} />
            <span>New Playlist</span>
          </button>
        </div>
        
        {/* Compact Search Indicator (Mobile) */}
        {!showSearchModal && searchQuery.trim() !== '' && (
          <div className="mx-4 mt-3 flex items-center bg-[var(--bg-elevated)]/50 border border-[var(--border)] rounded-xl px-3 py-1.5 shadow-sm flex-shrink-0">
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

      {/* Desktop Header with NavBreadcrumbs & Actions */}
      <div className="hidden md:flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Playlist System</span>
            <span>•</span>
            <span className="text-[var(--accent)] font-semibold">Real Filesystem</span>
          </div>
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center flex-wrap gap-1.5 text-lg font-display font-semibold">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              const isOver = isDraggingOverPath === crumb.path;
              return (
                <React.Fragment key={crumb.path}>
                  {idx > 0 && <ChevronRight size={16} className="text-[var(--text-tertiary)] opacity-60" />}
                  <button
                    onClick={() => setCurrentPath(crumb.path)}
                    onDragOver={(e) => handleDragOver(e, crumb.path)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, crumb.path)}
                    className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
                      isLast 
                        ? 'text-[var(--text-primary)] font-bold bg-[var(--bg-elevated)]/50' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/30'
                    } ${isOver ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-dashed border-[var(--accent)] scale-105' : ''}`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          {currentPath !== "/" && (
            <>
              <button
                onClick={() => {
                  const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || "/";
                  setCurrentPath(parent);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-[var(--bg-panel)] transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Go Up</span>
              </button>
              
              <button
                onClick={() => {
                  setFolderToRename(currentPath);
                  const currentName = currentPath.split('/').pop() || '';
                  setRenameValue(currentName);
                  setIsRenameModalOpen(true);
                }}
                className="p-2.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors cursor-pointer"
                title="Rename Current Playlist"
              >
                <Edit3 size={16} />
              </button>

              <button
                onClick={() => handleDeleteFolder(currentPath)}
                className="p-2.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-colors cursor-pointer"
                title="Delete Current Playlist"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-[var(--bg-base)] rounded-full font-semibold shadow-lg shadow-[var(--accent)]/15 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
          >
            <FolderPlus size={16} />
            <span>New Playlist</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Folder Grid & Song Table */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[var(--bg-panel)] md:rounded-3xl border border-[var(--border)] shadow-sm md:-mx-0 -mx-4">
        
        {/* Inner Search & Toolbar (Desktop) */}
        <div className="hidden md:flex px-6 py-4 border-b border-[var(--border)] items-center justify-between gap-4 flex-wrap bg-[var(--bg-panel)]/50 backdrop-blur-md sticky top-0 z-20">
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={16} />
            <input 
              type="text" 
              placeholder="Search in this folder..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            {selectedTrackIds.length > 0 && (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="text-xs font-mono text-[var(--text-secondary)] mr-1 bg-[var(--bg-elevated)] px-2.5 py-1 rounded-full border border-[var(--border)]">
                  {selectedTrackIds.length} Selected
                </span>
                
                {/* Quick move dropdown or tooltip */}
                <span className="text-xs text-[var(--text-tertiary)] italic">
                  Drag items onto folders or breadcrumbs to move
                </span>
              </div>
            )}
            
            {/* Quick Play All Button */}
            {filteredTracks.length > 0 && (
              <button 
                onClick={() => playTrack(filteredTracks[0], filteredTracks)}
                className="w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--bg-base)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                title="Play All Songs"
              >
                <Play size={18} fill="currentColor" className="ml-0.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic List Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 pt-0 scrollbar-thin space-y-8">
          {/* Spacer to preserve top padding while keeping sticky top-0 exactly at the container boundary */}
          <div className="h-6 flex-shrink-0" />
          
          {/* Sub-Playlists (Folders) Section */}
          {subfolders.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
                <span>Playlists</span>
                <span className="px-1.5 py-0.5 bg-[var(--bg-elevated)] rounded text-[10px] text-[var(--text-secondary)]">
                  {subfolders.length}
                </span>
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {subfolders.map((folderPath) => {
                  const folderName = folderPath.split('/').pop() || "";
                  const isOver = isDraggingOverPath === folderPath;
                  const isMenuOpen = activeMenuFolder === folderPath;

                  // Count child songs/folders in this playlist path
                  const songCount = tracks.filter(t => t.parentPath === folderPath).length;
                  const childFolderCount = directories.filter(d => d.startsWith(folderPath + "/") && d.split('/').length === folderPath.split('/').length + 1).length;

                  return (
                    <motion.div
                      key={folderPath}
                      layoutId={`folder-${folderPath}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'folder', { path: folderPath })}
                      onDragOver={(e) => handleDragOver(e, folderPath)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, folderPath)}
                      onClick={() => {
                        setCurrentPath(folderPath);
                        setSearchQuery('');
                      }}
                      className={`group relative flex flex-col p-4 bg-[var(--bg-elevated)]/40 hover:bg-[var(--bg-elevated)] border rounded-2xl transition-all duration-300 cursor-pointer ${
                        isOver 
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 scale-102 border-dashed' 
                          : 'border-[var(--border)]'
                      }`}
                    >
                      {/* Drag cover handle layer */}
                      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuFolder(isMenuOpen ? null : folderPath);
                          }}
                          className="p-1.5 rounded-full hover:bg-[var(--bg-panel)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                        >
                          <MoreVertical size={14} />
                        </button>
                        
                        {/* Custom Dropdown Context Menu for Folder */}
                        {isMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setActiveMenuFolder(null); }} />
                            <div className="absolute right-0 mt-1 w-36 bg-[var(--bg-panel)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-30 animate-fade-in text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFolderToRename(folderPath);
                                  setRenameValue(folderName);
                                  setIsRenameModalOpen(true);
                                  setActiveMenuFolder(null);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                              >
                                <Edit3 size={12} />
                                <span>Rename</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(folderPath);
                                  setActiveMenuFolder(null);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 hover:bg-[var(--bg-elevated)] text-red-500"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Folder visual icon container */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-[var(--accent)]">
                        <Folder size={24} fill="currentColor" fillOpacity={0.15} />
                      </div>

                      {/* Name & File count metadata */}
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate block mb-1">
                        {folderName}
                      </span>
                      
                      <div className="text-[11px] text-[var(--text-tertiary)] font-mono flex items-center gap-1.5">
                        {songCount > 0 && (
                          <span>{songCount} {songCount === 1 ? 'song' : 'songs'}</span>
                        )}
                        {songCount > 0 && childFolderCount > 0 && <span>•</span>}
                        {childFolderCount > 0 && (
                          <span>{childFolderCount} {childFolderCount === 1 ? 'subfolder' : 'subfolders'}</span>
                        )}
                        {songCount === 0 && childFolderCount === 0 && (
                          <span className="text-red-500/80 italic flex items-center gap-1">
                            <FolderDown size={10} />
                            Empty
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Songs (Files) Section */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
              <span>Songs</span>
              <span className="px-1.5 py-0.5 bg-[var(--bg-elevated)] rounded text-[10px] text-[var(--text-secondary)]">
                {filteredTracks.length}
              </span>
            </h3>

            {filteredTracks.length === 0 ? (
              subfolders.length === 0 ? (
                /* Pure Folder Empty State */
                <div className="text-center py-20 px-6 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-elevated)]/10">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4 text-[var(--text-tertiary)]">
                    <Folder size={24} className="opacity-40" />
                  </div>
                  <h2 className="text-base font-semibold mb-1">Empty Playlist</h2>
                  <p className="text-xs text-[var(--text-tertiary)] max-w-xs mx-auto mb-5">
                    This directory has no songs or sub-playlists inside it. Click "New Playlist" or drag-and-drop tracks to get started.
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[var(--text-tertiary)] italic">
                  No audio files directly in this directory
                </div>
              )
            ) : (
              /* Songs Table Layout */
              <div className="space-y-1">
                {/* Tracks Rows */}
                {filteredTracks.map((track) => {
                  const isSelected = selectedTrackIds.includes(track.id);
                  return (
                    <div
                      key={track.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'song', { id: track.id })}
                      className={`flex items-center px-2 md:px-4 py-2.5 md:py-3 hover:bg-[var(--bg-elevated)] rounded-xl transition-all duration-200 group cursor-grab active:cursor-grabbing ${
                        isSelected 
                          ? 'bg-[var(--accent)]/5 border-l-2 border-[var(--accent)] pl-[6px] md:pl-[14px]' 
                          : 'border-l-2 border-transparent'
                      }`}
                    >
                      {/* Checkbox select */}
                      <div className="w-8 md:w-10 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => toggleSelectTrack(track.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            isSelected 
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-base)]' 
                              : 'border-[var(--border)] group-hover:border-[var(--text-secondary)]'
                          }`}
                        >
                          {isSelected && <Check size={10} className="stroke-[3]" />}
                        </button>
                      </div>

                      {/* Play Action */}
                      <div className="w-8 md:w-12 flex items-center justify-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); playTrack(track, filteredTracks); }}
                          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                          <Play size={14} fill="currentColor" />
                        </button>
                      </div>

                      {/* Cover, Title & Artist */}
                      <div className="flex-1 flex items-center gap-3 md:gap-4 min-w-0" onDoubleClick={() => playTrack(track, filteredTracks)} onClick={() => playTrack(track, filteredTracks)}>
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded shadow-sm overflow-hidden bg-[var(--bg-base)] flex-shrink-0 relative">
                          {track.coverUrl ? (
                            <CoverArtImage src={track.coverUrl} className="w-full h-full object-cover" wrapperClassName="w-full h-full" fallbackClassName="bg-[var(--bg-elevated)]" alt="" />
                          ) : (
                            <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-tertiary)]">
                              <Music size={14} className="md:w-4 md:h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{track.title}</p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">{track.artist}</p>
                        </div>
                      </div>

                      {/* Album */}
                      <div className="w-40 hidden md:block text-sm text-[var(--text-secondary)] truncate">
                        {track.album}
                      </div>

                      {/* Favorite Button */}
                      <div className="w-10 md:w-12 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavorite(track.id)}
                          className={`p-2 rounded-full transition-colors cursor-pointer ${
                            track.isFavorite 
                              ? 'text-red-500' 
                              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <Heart size={14} fill={track.isFavorite ? "currentColor" : "none"} />
                        </button>
                      </div>

                      {/* Duration */}
                      <div className="w-12 md:w-20 text-right text-xs text-[var(--text-tertiary)] font-mono">
                        {formatTime(track.duration)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* OVERLAY: Create New Playlist Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <h3 className="text-lg font-display font-bold mb-4">Create New Playlist</h3>
              <form onSubmit={handleCreateFolder}>
                <div className="space-y-4">
                  <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 font-mono">
                    <span>Target Folder:</span>
                    <span className="text-[var(--text-secondary)] font-semibold">{currentPath}</span>
                  </div>
                  <input
                    type="text"
                    placeholder="E.g. Rock, Chill Out, Favorites..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setIsCreateModalOpen(false); setNewFolderName(''); }}
                    className="px-4 py-2 text-sm rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-panel)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold rounded-full bg-[var(--accent)] text-[var(--bg-base)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: Rename Playlist Modal */}
      <AnimatePresence>
        {isRenameModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <h3 className="text-lg font-display font-bold mb-4">Rename Playlist</h3>
              <form onSubmit={handleRenameFolder}>
                <div className="space-y-4">
                  <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 font-mono">
                    <span>Renaming:</span>
                    <span className="text-[var(--text-secondary)] font-semibold truncate max-w-[280px] block">{folderToRename}</span>
                  </div>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setIsRenameModalOpen(false); setRenameValue(''); setFolderToRename(null); }}
                    className="px-4 py-2 text-sm rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-panel)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold rounded-full bg-[var(--accent)] text-[var(--bg-base)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Rename
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: Confirmation for non-empty Folder Deletion */}
      <AnimatePresence>
        {isConfirmDeleteOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-55 animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-panel)] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <div className="text-red-500 mb-3 flex items-center gap-2">
                <Trash2 size={24} />
                <h3 className="text-lg font-display font-bold">Delete Non-Empty Playlist</h3>
              </div>
              
              <div className="text-sm text-[var(--text-secondary)] space-y-3 leading-relaxed">
                <p>
                  The playlist folder <span className="font-mono text-red-400 bg-red-500/5 px-1.5 py-0.5 rounded border border-red-500/10 font-semibold">{folderToDelete}</span> contains songs or sub-playlists.
                </p>
                <p className="text-xs text-[var(--text-tertiary)] italic">
                  Deleting this folder will permanently delete all its files and folders from the filesystem disk. This operation is IRREVERSIBLE!
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsConfirmDeleteOpen(false); setFolderToDelete(null); setIsFolderNotEmptyWarning(false); }}
                  className="px-4 py-2 text-sm rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-panel)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => folderToDelete && handleDeleteFolder(folderToDelete, true)}
                  className="px-5 py-2 text-sm font-semibold rounded-full bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Delete and Clear Disk
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
                              <CoverArtImage src={track.coverUrl} className="w-full h-full object-cover" wrapperClassName="w-full h-full" fallbackClassName="bg-[var(--bg-elevated)]" alt="" />
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
