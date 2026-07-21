import { create } from 'zustand';
import { AppSettings, Theme, EqPreset, ReverbPreset } from '../types';
import { dbStore } from '../lib/db';
import { useThemeStore } from './useThemeStore';

interface SettingsState extends AppSettings {
  isLoaded: boolean;
  setTheme: (theme: Theme) => void;
  setVolume: (volume: number) => void;
  setEqPreset: (preset: EqPreset) => void;
  setEqBands: (bands: number[]) => void;
  setReverbPreset: (preset: ReverbPreset) => void;
  setLastScanTime: (time: number) => void;
  setAutoMonitor: (monitor: boolean) => void;
  setSidebarExpanded: (expanded: boolean) => void;
  loadSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: 'frosted-glass',
  volume: 0.8,
  eqPreset: 'flat',
  reverbPreset: 'none',
  eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  playbackSpeed: 1,
  crossfade: false,
  crossfadeDuration: 3,
  lastScanTime: 0,
  autoMonitor: true,
  isSidebarExpanded: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => {
  const save = (updates: Partial<AppSettings>) => {
    const state = get();
    const toSave: AppSettings = {
      theme: updates.theme !== undefined ? updates.theme : state.theme,
      volume: updates.volume !== undefined ? updates.volume : state.volume,
      eqPreset: updates.eqPreset !== undefined ? updates.eqPreset : state.eqPreset,
      reverbPreset: updates.reverbPreset !== undefined ? updates.reverbPreset : state.reverbPreset,
      eqBands: updates.eqBands !== undefined ? updates.eqBands : state.eqBands,
      playbackSpeed: updates.playbackSpeed !== undefined ? updates.playbackSpeed : state.playbackSpeed,
      crossfade: updates.crossfade !== undefined ? updates.crossfade : state.crossfade,
      crossfadeDuration: updates.crossfadeDuration !== undefined ? updates.crossfadeDuration : state.crossfadeDuration,
      lastScanTime: updates.lastScanTime !== undefined ? updates.lastScanTime : state.lastScanTime,
      autoMonitor: updates.autoMonitor !== undefined ? updates.autoMonitor : state.autoMonitor,
      isSidebarExpanded: updates.isSidebarExpanded !== undefined ? updates.isSidebarExpanded : state.isSidebarExpanded,
    };
    dbStore.saveSettings(toSave);
  };

  return {
    ...defaultSettings,
    isLoaded: false,
    
    setTheme: (theme) => {
      set({ theme });
      save({ theme });
      useThemeStore.getState().setTheme(theme);
    },
    
    setVolume: (volume) => {
      set({ volume });
      save({ volume });
    },
    setEqPreset: (eqPreset) => {
      set({ eqPreset });
      save({ eqPreset });
    },
    setEqBands: (eqBands) => {
      set({ eqBands, eqPreset: 'custom' });
      save({ eqBands, eqPreset: 'custom' });
    },
    setReverbPreset: (reverbPreset) => {
      set({ reverbPreset });
      save({ reverbPreset });
    },
    setLastScanTime: (lastScanTime) => {
      set({ lastScanTime });
      save({ lastScanTime });
    },
    setAutoMonitor: (autoMonitor) => {
      set({ autoMonitor });
      save({ autoMonitor });
    },
    setSidebarExpanded: (isSidebarExpanded) => {
      set({ isSidebarExpanded });
      save({ isSidebarExpanded });
    },
    loadSettings: async () => {
      // First load themes to make sure CustomTheme store is fully active
      useThemeStore.getState().loadThemes();
      
      const saved = await dbStore.getSettings();
      const merged = { ...defaultSettings, ...saved };
      
      // If a saved theme exists, apply it
      if (merged.theme) {
        useThemeStore.getState().setTheme(merged.theme);
      } else {
        const activeId = useThemeStore.getState().activeThemeId;
        merged.theme = activeId;
      }
      
      set({ ...merged, isLoaded: true });
    }
  };
});
