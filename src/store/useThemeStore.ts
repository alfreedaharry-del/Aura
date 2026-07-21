import { create } from 'zustand';
import { CustomTheme } from '../types';

export const presetThemes: CustomTheme[] = [
  {
    id: 'frosted-glass',
    name: 'Frosted Glass',
    backgroundColor: '#0a0a0b',
    primaryColor: 'rgba(0, 0, 0, 0.25)',
    accentColor: '#ffffff',
    accentHoverColor: 'rgba(255, 255, 255, 0.8)',
    surfaceColor: 'rgba(255, 255, 255, 0.05)',
    primaryTextColor: '#f5f5f7',
    secondaryTextColor: 'rgba(255, 255, 255, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    glassTintColor: 'rgba(0, 0, 0, 0.45)',
    iconColor: '#ffffff',
    isPreset: true,
  },
  {
    id: 'pure-white',
    name: 'Pure White',
    backgroundColor: '#f9f9fb',
    primaryColor: '#ffffff',
    accentColor: '#111111',
    accentHoverColor: '#444444',
    surfaceColor: '#f1f1f4',
    primaryTextColor: '#000000',
    secondaryTextColor: '#555555',
    borderColor: '#eaeaea',
    glassTintColor: 'rgba(255, 255, 255, 0.75)',
    iconColor: '#111111',
    isPreset: true,
  },
  {
    id: 'violet-gold',
    name: 'Violet & Gold',
    backgroundColor: '#1a0b2e',
    primaryColor: '#2d1b4e',
    accentColor: '#d4af37',
    accentHoverColor: '#e5c04e',
    surfaceColor: '#3b2563',
    primaryTextColor: '#ffffff',
    secondaryTextColor: '#bba8d8',
    borderColor: '#4a3175',
    glassTintColor: 'rgba(45, 27, 78, 0.6)',
    iconColor: '#d4af37',
    isPreset: true,
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    backgroundColor: '#18181a',
    primaryColor: '#202022',
    accentColor: '#ffffff',
    accentHoverColor: '#e0e0e0',
    surfaceColor: '#28282b',
    primaryTextColor: '#f5f5f6',
    secondaryTextColor: '#a0a0a5',
    borderColor: '#333336',
    glassTintColor: 'rgba(32, 32, 34, 0.65)',
    iconColor: '#ffffff',
    isPreset: true,
  },
  {
    id: 'walnut-wood',
    name: 'Walnut Wood',
    backgroundColor: '#2a1f1a',
    primaryColor: '#3b2c24',
    accentColor: '#d97736',
    accentHoverColor: '#ff914d',
    surfaceColor: '#4e3a31',
    primaryTextColor: '#f2e3d5',
    secondaryTextColor: '#b89b88',
    borderColor: '#5c453a',
    glassTintColor: 'rgba(59, 44, 36, 0.7)',
    iconColor: '#d97736',
    isPreset: true,
  },
  {
    id: 'titanium',
    name: 'Titanium',
    backgroundColor: '#b0b3b8',
    primaryColor: '#c4c7cc',
    accentColor: '#1c1e21',
    accentHoverColor: '#3a3d42',
    surfaceColor: '#d8dbdf',
    primaryTextColor: '#1c1e21',
    secondaryTextColor: '#4a4d52',
    borderColor: '#9ea1a6',
    glassTintColor: 'rgba(196, 199, 204, 0.55)',
    iconColor: '#1c1e21',
    isPreset: true,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    backgroundColor: '#050b14',
    primaryColor: '#0a1324',
    accentColor: '#00e5ff',
    accentHoverColor: '#66f0ff',
    surfaceColor: '#111d36',
    primaryTextColor: '#e6f0ff',
    secondaryTextColor: '#8da6d1',
    borderColor: '#182847',
    glassTintColor: 'rgba(10, 19, 36, 0.65)',
    iconColor: '#00e5ff',
    isPreset: true,
  }
];

export const applyThemeToDom = (theme: CustomTheme) => {
  if (!theme) return;
  const root = document.documentElement;
  
  // Base properties
  root.style.setProperty('--bg-base', theme.backgroundColor);
  root.style.setProperty('--bg-panel', theme.primaryColor);
  root.style.setProperty('--bg-elevated', theme.surfaceColor);
  root.style.setProperty('--accent', theme.accentColor);
  root.style.setProperty('--accent-hover', theme.accentHoverColor || `${theme.accentColor}cc`);
  root.style.setProperty('--text-primary', theme.primaryTextColor);
  root.style.setProperty('--text-secondary', theme.secondaryTextColor);
  
  // Compute secondary text for sub-components (with opacity)
  let tertiary = theme.secondaryTextColor;
  if (tertiary.startsWith('#')) {
    tertiary = tertiary + '80'; // Add hex opacity
  } else if (tertiary.startsWith('rgba') || tertiary.startsWith('hsla')) {
    // Keep as is or make lighter
  } else {
    tertiary = `rgba(${theme.primaryTextColor.includes('0') ? '0,0,0' : '255,255,255'}, 0.4)`;
  }
  root.style.setProperty('--text-tertiary', tertiary);
  
  root.style.setProperty('--border', theme.borderColor);
  root.style.setProperty('--glass-bg', theme.glassTintColor);
  root.style.setProperty('--glass-border', theme.borderColor);
  
  // Custom theme gradient color override
  root.style.setProperty('--gradient-color', theme.gradientColor || theme.backgroundColor);
  root.style.setProperty('--icon-color', theme.iconColor || theme.accentColor);
};

interface ThemeState {
  themes: CustomTheme[];
  activeThemeId: string;
  activeTheme: CustomTheme;
  editingTheme: CustomTheme | null;
  loadThemes: () => void;
  setTheme: (id: string) => void;
  saveTheme: (theme: CustomTheme) => void;
  createTheme: (name: string, baseTheme?: CustomTheme) => CustomTheme;
  deleteTheme: (id: string) => void;
  duplicateTheme: (id: string) => void;
  updateEditingThemeColor: (colorKey: keyof CustomTheme, value: string) => void;
  setEditingTheme: (theme: CustomTheme | null) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const saveToStorage = (themes: CustomTheme[], activeId: string) => {
    localStorage.setItem('aura-custom-themes', JSON.stringify(themes.filter(t => !t.isPreset)));
    localStorage.setItem('aura-active-theme-id', activeId);
  };

  return {
    themes: presetThemes,
    activeThemeId: 'frosted-glass',
    activeTheme: presetThemes[0],
    editingTheme: null,

    loadThemes: () => {
      const storedThemesRaw = localStorage.getItem('aura-custom-themes');
      const storedActiveId = localStorage.getItem('aura-active-theme-id');
      
      let customThemes: CustomTheme[] = [];
      if (storedThemesRaw) {
        try {
          customThemes = JSON.parse(storedThemesRaw);
        } catch (e) {
          console.error('Failed to parse custom themes', e);
        }
      }

      const allThemes = [...presetThemes, ...customThemes];
      const activeId = storedActiveId || 'frosted-glass';
      const active = allThemes.find(t => t.id === activeId) || allThemes[0];
      
      set({
        themes: allThemes,
        activeThemeId: activeId,
        activeTheme: active
      });
      
      applyThemeToDom(active);
    },

    setTheme: (id) => {
      const { themes } = get();
      const theme = themes.find(t => t.id === id) || themes[0];
      set({ activeThemeId: id, activeTheme: theme });
      applyThemeToDom(theme);
      saveToStorage(themes, id);
    },

    createTheme: (name, baseTheme) => {
      const { themes } = get();
      const base = baseTheme || themes.find(t => t.id === 'frosted-glass') || themes[0];
      const newId = `theme-${Date.now()}`;
      
      const newTheme: CustomTheme = {
        ...base,
        id: newId,
        name,
        isPreset: false,
        createdAt: Date.now(),
      };

      const updatedThemes = [...themes, newTheme];
      set({
        themes: updatedThemes,
        activeThemeId: newId,
        activeTheme: newTheme,
      });

      applyThemeToDom(newTheme);
      saveToStorage(updatedThemes, newId);
      return newTheme;
    },

    saveTheme: (theme) => {
      const { themes, activeThemeId } = get();
      const updatedThemes = themes.map(t => t.id === theme.id ? { ...theme, isPreset: false } : t);
      
      const isActive = activeThemeId === theme.id;
      
      set({
        themes: updatedThemes,
        activeTheme: isActive ? theme : get().activeTheme,
      });

      if (isActive) {
        applyThemeToDom(theme);
      }
      
      saveToStorage(updatedThemes, activeThemeId);
    },

    deleteTheme: (id) => {
      const { themes, activeThemeId } = get();
      // Cannot delete preset
      const themeToDelete = themes.find(t => t.id === id);
      if (!themeToDelete || themeToDelete.isPreset) return;

      const updatedThemes = themes.filter(t => t.id !== id);
      
      let nextActiveId = activeThemeId;
      if (activeThemeId === id) {
        nextActiveId = 'frosted-glass';
      }

      const nextActive = updatedThemes.find(t => t.id === nextActiveId) || updatedThemes[0];
      
      set({
        themes: updatedThemes,
        activeThemeId: nextActiveId,
        activeTheme: nextActive
      });

      applyThemeToDom(nextActive);
      saveToStorage(updatedThemes, nextActiveId);
    },

    duplicateTheme: (id) => {
      const { themes } = get();
      const themeToDup = themes.find(t => t.id === id);
      if (!themeToDup) return;

      const newId = `theme-${Date.now()}`;
      const duplicated: CustomTheme = {
        ...themeToDup,
        id: newId,
        name: `${themeToDup.name} (Copy)`,
        isPreset: false,
        createdAt: Date.now(),
      };

      const updatedThemes = [...themes, duplicated];
      set({
        themes: updatedThemes,
        activeThemeId: newId,
        activeTheme: duplicated,
      });

      applyThemeToDom(duplicated);
      saveToStorage(updatedThemes, newId);
    },

    updateEditingThemeColor: (colorKey, value) => {
      const { editingTheme } = get();
      if (!editingTheme) return;

      const updated = {
        ...editingTheme,
        [colorKey]: value,
      };

      set({ editingTheme: updated });
      applyThemeToDom(updated); // Live preview!
    },

    setEditingTheme: (theme) => {
      set({ editingTheme: theme });
      if (theme) {
        applyThemeToDom(theme);
      } else {
        // Revert live preview back to active theme
        applyThemeToDom(get().activeTheme);
      }
    }
  };
});
