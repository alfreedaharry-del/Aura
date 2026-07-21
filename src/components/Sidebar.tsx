import React, { useEffect } from 'react';
import { Home, Library, ListMusic, Settings, Disc3, Menu, X } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, mobileOpen, onCloseMobile }) => {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const { isSidebarExpanded, setSidebarExpanded } = useSettingsStore();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mobileOpen, onCloseMobile]);

  const handleNav = (id: string) => {
    onNavigate(id);
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  const renderSidebarContent = (isMobile: boolean) => {
    const expanded = isMobile || isSidebarExpanded;
    return (
      <div className={`h-full flex flex-col premium-sidebar-glass transition-[width,background-color,border-color] duration-300 ${expanded ? 'w-64' : 'w-20'}`}>
        <div className={`p-6 pb-4 flex items-center ${expanded ? 'justify-between' : 'justify-center'} h-20`}>
          {expanded && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
              </div>
              <h1 className="text-lg font-semibold tracking-tight uppercase text-[var(--text-primary)]">Aura</h1>
            </div>
          )}
          {!isMobile && (
            <button 
              onClick={() => setSidebarExpanded(!isSidebarExpanded)}
              className="p-2 -m-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors md:block hidden"
            >
              <Menu size={20} />
            </button>
          )}
          {isMobile && (
            <button 
              onClick={onCloseMobile}
              className="p-2 -m-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className={`flex-1 ${expanded ? 'px-4' : 'px-2'} py-2 space-y-2`}>
          {navItems.map(item => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center ${expanded ? 'gap-3 px-3' : 'justify-center'} py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                  active 
                    ? 'bg-[var(--accent)] text-[var(--bg-base)] shadow-md shadow-[var(--accent)]/20' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
                title={!expanded ? item.label : undefined}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {expanded && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (static) */}
      <div className="hidden md:block h-full">
        {renderSidebarContent(false)}
      </div>
      
      {/* Mobile Sidebar (animated) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-y-0 left-0 z-50 md:hidden h-full"
          >
            {renderSidebarContent(true)}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
