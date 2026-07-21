import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottomPlayer } from './components/BottomPlayer';
import { HomeView } from './views/HomeView';
import { LibraryView } from './views/LibraryView';
import { PlaylistsView } from './views/PlaylistsView';
import { SettingsView } from './views/SettingsView';
import { NowPlayingView } from './views/NowPlayingView';
import { QueueView } from './views/QueueView';
import { useSettingsStore } from './store/useSettingsStore';
import { useLibraryStore } from './store/useLibraryStore';
import { usePlayerStore, useActivePlayer } from './store/usePlayerStore';
import { motion, AnimatePresence } from 'motion/react';
import { dbStore } from './lib/db';
import { Menu } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const nowPlayingOpen = usePlayerStore(s => s.nowPlayingOpen);
  const setNowPlayingOpen = usePlayerStore(s => s.setNowPlayingOpen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const settings = useSettingsStore();
  const library = useLibraryStore();
  
  // Use useActivePlayer to resolve dynamic blob coverUrls correctly
  const { currentTrack } = useActivePlayer();

  // Swipe gesture tracking for Mobile Home <-> Queue
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 70;
    const isRightSwipe = distance < -70;

    if (isLeftSwipe) {
      if (currentView === 'home') setCurrentView('queue');
    }
    if (isRightSwipe) {
      if (currentView === 'queue') setCurrentView('home');
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    dbStore.getSettings().then(async () => {
      await settings.loadSettings();
      await library.loadLibrary();
      await usePlayerStore.getState().initPlayer();
    });
  }, []);

  if (!settings.isLoaded || library.status === 'initializing') {
    return <div className="h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)]">Loading...</div>;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomeView />;
      case 'library': return <LibraryView />;
      case 'queue': return <QueueView />;
      case 'playlists': return <PlaylistsView />;
      case 'settings': return <SettingsView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="h-screen flex bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden relative transition-colors duration-500">
      {/* Dedicated Background Artwork Layer (Rendered order: 1. Base theme, 2. Artwork layer, 3. Home/other UI, 4. Overlays) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <AnimatePresence mode="popLayout">
          {currentTrack?.coverUrl && (
            <motion.div
              key={currentTrack.coverUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={currentTrack.coverUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover scale-[1.18] filter blur-[110px] select-none"
              />
              {/* Premium Vertical Fade: Extremely gradual multi-stop mask to blend completely into the active theme color near bottom */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-base)]/15 via-[var(--bg-base)]/45 via-[var(--bg-base)]/75 via-[var(--bg-base)]/95 to-[var(--bg-base)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Sidebar 
        currentView={nowPlayingOpen ? 'now-playing' : currentView} 
        onNavigate={(view) => {
          if (view === 'now-playing') {
            setNowPlayingOpen(true);
          } else {
            setCurrentView(view);
            setNowPlayingOpen(false);
          }
        }} 
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      
      <main 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 relative overflow-hidden flex flex-col w-full"
      >
        {/* Floating Menu Button on Mobile (absolute top-left) */}
        <div className="md:hidden absolute top-4 left-4 z-40">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-3 rounded-full bg-[var(--glass-bg)] border border-[var(--border)] backdrop-blur-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* View container */}
        <div className="flex-1 relative overflow-hidden w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 overflow-hidden"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mini player shown only at the bottom of right-side panel when music is playing and full Now Playing is closed */}
        {currentTrack && !nowPlayingOpen && (
          <BottomPlayer />
        )}

        <AnimatePresence>
          {nowPlayingOpen && (
            <NowPlayingView onClose={() => setNowPlayingOpen(false)} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
