import React, { useState, useRef } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { 
  Palette, 
  Plus, 
  Trash2, 
  Check, 
  Edit3, 
  Undo2, 
  Save,
  HelpCircle,
  X
} from 'lucide-react';
import { CustomTheme } from '../types';

export const SettingsView: React.FC = () => {
  // Theme store state
  const { 
    themes, 
    activeThemeId, 
    activeTheme, 
    editingTheme, 
    setTheme, 
    createTheme, 
    saveTheme, 
    deleteTheme, 
    setEditingTheme 
  } = useThemeStore();

  const [newThemeName, setNewThemeName] = useState('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const designerRef = useRef<HTMLDivElement>(null);
  
  // Custom modals/creation flow state
  const [showNameModal, setShowNameModal] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<CustomTheme | null>(null);

  const handleOpenNewThemeModal = () => {
    setNewThemeName('');
    setShowNameModal(true);
  };

  const handleNewThemeContinue = () => {
    if (!newThemeName.trim()) {
      alert('Please enter a name for your theme.');
      return;
    }
    
    // Close the naming modal
    setShowNameModal(false);
    setIsCreatingNew(true);
    
    // Initialize temporary theme object based on the currently active theme
    const tempTheme: CustomTheme = {
      id: `temp-${Date.now()}`,
      name: newThemeName.trim(),
      backgroundColor: activeTheme.backgroundColor,
      primaryColor: activeTheme.primaryColor,
      accentColor: activeTheme.accentColor,
      accentHoverColor: activeTheme.accentHoverColor || activeTheme.accentColor,
      surfaceColor: activeTheme.surfaceColor,
      primaryTextColor: activeTheme.primaryTextColor,
      secondaryTextColor: activeTheme.secondaryTextColor,
      borderColor: activeTheme.borderColor,
      glassTintColor: activeTheme.glassTintColor,
      iconColor: activeTheme.iconColor || activeTheme.accentColor,
      isPreset: false,
    };
    
    // Put into editing mode directly to open Theme Editor
    setEditingTheme(tempTheme);

    // Smoothly scroll to the Theme Designer so it is immediately visible at the top of the viewport
    setTimeout(() => {
      if (designerRef.current) {
        designerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleColorChange = (key: keyof CustomTheme, value: string) => {
    if (!editingTheme) return;
    
    const updated = {
      ...editingTheme,
      [key]: value
    };
    
    // Auto-derive coordinating secondary/derived colors
    if (key === 'accentColor') {
      updated.iconColor = value;
      updated.accentHoverColor = value;
    } else if (key === 'backgroundColor') {
      updated.gradientColor = value;
    } else if (key === 'primaryTextColor') {
      const isDarkText = value.toLowerCase() === '#000000' || value.toLowerCase() === '#111111' || value.toLowerCase() === '#1c1e21';
      updated.borderColor = isDarkText ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    }
    
    setEditingTheme(updated);
  };

  const handleSaveTheme = () => {
    if (editingTheme) {
      if (isCreatingNew) {
        createTheme(editingTheme.name, editingTheme);
        setIsCreatingNew(false);
      } else {
        saveTheme(editingTheme);
      }
      setEditingTheme(null);
    }
  };

  const handleCancelEditing = () => {
    setEditingTheme(null);
    setIsCreatingNew(false);
  };

  const handleSelectTheme = (themeId: string) => {
    setTheme(themeId);
    setEditingTheme(null);
    setIsCreatingNew(false);
  };

  const handleStartRename = (theme: CustomTheme, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNameId(theme.id);
    setRenameValue(theme.name);
  };

  const handleSaveRename = (theme: CustomTheme) => {
    if (renameValue.trim()) {
      saveTheme({ ...theme, name: renameValue.trim() });
    }
    setEditingNameId(null);
  };

  const handleConfirmDelete = () => {
    if (themeToDelete) {
      deleteTheme(themeToDelete.id);
      setThemeToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-8 pb-4 h-full overflow-y-auto max-w-5xl mx-auto space-y-6 md:space-y-12">
      <div className="md:hidden flex items-center pt-4 pl-20 pr-4 mb-2 pb-4 border-b border-[var(--border)]/30">
        <h1 className="text-2xl font-display font-bold truncate">Settings</h1>
      </div>
      <h1 className="hidden md:block text-3xl font-display font-bold">Settings</h1>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Theme Library */}
        <div className="xl:col-span-7">
          <section>
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Palette className="text-[var(--accent)]" size={20} />
                <h2 className="text-lg font-bold font-display">Theme Library</h2>
              </div>
              <button 
                onClick={handleOpenNewThemeModal}
                className="px-3.5 py-1.5 bg-[var(--accent)] text-[var(--bg-base)] font-bold rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-md shadow-[var(--accent)]/10 animate-in fade-in duration-200"
              >
                <Plus size={14} />
                New Theme
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themes.map(t => {
                const isActive = activeThemeId === t.id;
                
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className={`p-4 rounded-2xl border flex flex-col justify-between h-36 transition-all relative cursor-pointer group ${
                      isActive 
                        ? 'border-[var(--accent)] bg-[var(--bg-elevated)] ring-1 ring-[var(--accent)] shadow-lg shadow-[var(--accent)]/5' 
                        : 'border-[var(--border)] hover:border-[var(--text-tertiary)] bg-[var(--bg-panel)]/40 hover:bg-[var(--bg-panel)]/75'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        {editingNameId === t.id ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => handleSaveRename(t)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(t);
                              if (e.key === 'Escape') setEditingNameId(null);
                            }}
                            autoFocus
                            className="bg-[var(--bg-base)] border border-[var(--accent)] px-2 py-0.5 rounded text-sm w-full focus:outline-none text-[var(--text-primary)]"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-sm truncate text-[var(--text-primary)]">{t.name}</span>
                            {t.isPreset && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                                Preset
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-1 font-mono">
                          {t.isPreset ? 'Default theme' : 'Custom Designer theme'}
                        </p>
                      </div>
                      
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                        {/* Edit & Delete (only custom) */}
                        {!t.isPreset && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTheme(t);
                                setIsCreatingNew(false);
                              }}
                              title="Edit Theme Colors"
                              className="p-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] hover:text-[var(--accent)] text-[var(--text-secondary)] transition-all"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={(e) => handleStartRename(t, e)}
                              title="Rename Theme"
                              className="p-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] hover:text-[var(--accent)] text-[var(--text-secondary)] transition-all"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setThemeToDelete(t);
                              }}
                              title="Delete Theme"
                              className="p-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-red-500 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Color Dots Row Preview */}
                    <div className="flex items-center justify-between border-t border-[var(--border)]/60 pt-3">
                      <div className="flex gap-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: t.backgroundColor }} title="Base Background" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: t.primaryColor }} title="Panel Background" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: t.surfaceColor }} title="Card/Surface" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: t.accentColor }} title="Accent" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: t.primaryTextColor }} title="Primary Text" />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: t.secondaryTextColor }} title="Secondary Text" />
                      </div>

                      {isActive && (
                        <div className="flex items-center gap-1 text-[var(--accent)] text-xs font-bold">
                          <Check size={14} className="stroke-[3]" />
                          <span>Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Floating Custom Theme Designer (Smoked Glass Panel) */}
        <div ref={designerRef} className="xl:col-span-5">
          <div className="bg-[var(--bg-panel)]/60 backdrop-blur-2xl border border-[var(--border)] p-6 rounded-3xl sticky top-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="text-[var(--accent)]" size={18} />
                <h2 className="font-display font-bold text-base">
                  {editingTheme ? `Designer: ${editingTheme.name}` : 'Theme Designer'}
                </h2>
              </div>
              {editingTheme && (
                <button
                  onClick={handleCancelEditing}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 bg-[var(--bg-elevated)] px-2.5 py-1 rounded-lg border border-[var(--border)] transition-colors"
                >
                  <Undo2 size={12} />
                  Cancel
                </button>
              )}
            </div>

            {editingTheme ? (
              <div className="space-y-4">
                <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)] flex gap-2">
                  <HelpCircle size={14} className="flex-shrink-0 mt-0.5 text-[var(--accent)]" />
                  <span>
                    Your modifications are previewed throughout Aura in real-time. Click <strong>Save Changes</strong> to keep your design.
                  </span>
                </div>

                <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                  
                  {/* Primary Background */}
                  <ColorPickerRow 
                    label="Primary Background" 
                    colorKey="backgroundColor" 
                    value={editingTheme.backgroundColor} 
                    onChange={handleColorChange} 
                  />

                  {/* Secondary Background / Surface */}
                  <ColorPickerRow 
                    label="Secondary Background / Surface" 
                    colorKey="surfaceColor" 
                    value={editingTheme.surfaceColor} 
                    onChange={handleColorChange} 
                  />

                  {/* Accent Color */}
                  <ColorPickerRow 
                    label="Accent Color" 
                    colorKey="accentColor" 
                    value={editingTheme.accentColor} 
                    onChange={handleColorChange} 
                  />

                  {/* Primary Text */}
                  <ColorPickerRow 
                    label="Primary Text" 
                    colorKey="primaryTextColor" 
                    value={editingTheme.primaryTextColor} 
                    onChange={handleColorChange} 
                  />

                  {/* Secondary Text */}
                  <ColorPickerRow 
                    label="Secondary Text" 
                    colorKey="secondaryTextColor" 
                    value={editingTheme.secondaryTextColor} 
                    onChange={handleColorChange} 
                  />

                  {/* Interactive / Highlight Color */}
                  <ColorPickerRow 
                    label="Interactive / Highlight Color" 
                    colorKey="primaryColor" 
                    value={editingTheme.primaryColor} 
                    onChange={handleColorChange} 
                  />
                  
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex gap-2">
                  <button
                    onClick={handleSaveTheme}
                    className="flex-1 py-2.5 bg-[var(--accent)] text-[var(--bg-base)] font-bold text-sm rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[var(--accent)]/10"
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-4 border border-dashed border-[var(--border)] rounded-2xl">
                <Palette className="mx-auto text-[var(--text-tertiary)] opacity-40 mb-3" size={32} />
                <h3 className="font-display font-bold text-sm text-[var(--text-primary)] mb-1">No Theme Selected</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto mb-4">
                  Select any custom theme from the library to edit, or create a brand new theme.
                </p>
                <button
                  onClick={handleOpenNewThemeModal}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--bg-base)] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all text-xs shadow-md shadow-[var(--accent)]/10"
                >
                  Create Custom Theme
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL 1: Create Theme Naming Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="text-[var(--accent)]" size={20} />
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">New Custom Theme</h3>
              </div>
              <button 
                onClick={() => setShowNameModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--bg-panel)] text-[var(--text-secondary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                What would you like to name your theme?
              </p>
              <input
                type="text"
                placeholder="Theme Name (e.g., Cyberpunk, Forest Green)"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNewThemeContinue();
                }}
                className="w-full bg-[var(--bg-panel)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-medium"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowNameModal(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleNewThemeContinue}
                className="px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--bg-base)] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all text-sm shadow-md shadow-[var(--accent)]/10"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Theme Confirmation Modal */}
      {themeToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-500">
              <Trash2 size={22} />
              <h3 className="font-display font-bold text-lg">Delete Theme?</h3>
            </div>
            
            <p className="text-sm text-[var(--text-secondary)]">
              Delete <strong className="text-[var(--text-primary)]">'{themeToDelete.name}'</strong>? This action cannot be undone and will permanently remove this theme from your library.
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setThemeToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all text-sm shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent for Color Picker Row (supports both native picker and direct hex text input)
interface ColorPickerRowProps {
  label: string;
  colorKey: keyof CustomTheme;
  value: string;
  onChange: (key: keyof CustomTheme, value: string) => void;
}

const ColorPickerRow: React.FC<ColorPickerRowProps> = ({ label, colorKey, value, onChange }) => {
  // Safe hex extractor for native input
  const getSafeHex = (val: string) => {
    if (val.startsWith('#')) return val.substring(0, 7);
    if (val.startsWith('rgba') || val.startsWith('hsla')) {
      return '#3b82f6';
    }
    return '#111111';
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(colorKey, e.target.value);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(colorKey, e.target.value);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--border)]/40 last:border-0">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-[var(--text-primary)]">{label}</span>
        <span className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase">{colorKey}</span>
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="text"
          value={value}
          onChange={handleTextChange}
          className="bg-[var(--bg-base)] border border-[var(--border)] px-2 py-1 rounded-lg text-xs font-mono w-28 text-right focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
        />
        <div className="relative w-7 h-7 rounded-full overflow-hidden border border-[var(--border)] cursor-pointer flex-shrink-0 shadow-sm">
          <input 
            type="color"
            value={getSafeHex(value)}
            onChange={handleColorChange}
            className="absolute -inset-1 w-10 h-10 border-0 p-0 cursor-pointer bg-transparent"
          />
        </div>
      </div>
    </div>
  );
};
