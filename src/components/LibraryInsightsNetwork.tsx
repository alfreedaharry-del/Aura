import React, { useState, useEffect } from 'react';
import { motion, animate } from 'motion/react';
import { useThemeStore } from '../store/useThemeStore';

interface NetworkProps {
  totalTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  playlistCount: number;
  totalDurationStr: string;
  totalSizeStr: string;
  favoriteCount: number;
  recentCount: number;
}

// Custom animated counter component that counts smoothly from 0 to value
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1], // premium out-expo ease
      onUpdate: (latest) => setDisplayValue(Math.floor(latest))
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

export const LibraryInsightsNetwork: React.FC<NetworkProps> = ({
  totalTracks,
  uniqueArtists,
  playlistCount,
  totalDurationStr,
  totalSizeStr
}) => {
  const { activeTheme } = useThemeStore();

  // Compute contrast brightness for premium adaptation
  const isDarkBg = React.useMemo(() => {
    if (!activeTheme || !activeTheme.backgroundColor) return true;
    const color = activeTheme.backgroundColor;
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      let r = 0, g = 0, b = 0;
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      }
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 135;
    }
    return true; // default dark
  }, [activeTheme]);

  // Premium, modern sans-serif typography colors
  const numberColor = isDarkBg ? 'text-white/90' : 'text-zinc-800';
  const labelColor = isDarkBg ? 'text-white/40' : 'text-zinc-400';

  // Refined vertical gradient with seamless fade and subtle high-end grain texture background
  const textGradientStyle: React.CSSProperties = {
    backgroundImage: isDarkBg
      ? `linear-gradient(to bottom, rgba(226, 232, 240, 0.92) 0%, rgba(226, 232, 240, 0.5) 35%, rgba(226, 232, 240, 0.15) 75%, rgba(226, 232, 240, 0.04) 100%), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.025'/%3E%3C/svg%3E")`
      : `linear-gradient(to bottom, rgba(39, 39, 42, 0.92) 0%, rgba(39, 39, 42, 0.5) 35%, rgba(39, 39, 42, 0.15) 75%, rgba(39, 39, 42, 0.04) 100%), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.022'/%3E%3C/svg%3E")`,
    backgroundBlendMode: 'multiply',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline-block',
    fontWeight: 900,
    lineHeight: 0.8,
    letterSpacing: '-0.07em',
  };

  // Staggered variants for stats entries
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="w-full max-w-[1450px] mx-auto px-6 md:px-12 lg:px-16 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16 lg:gap-24 xl:gap-36 py-8"
      >
        {/* LEFT COLUMN: 55-60% width - Visual Hero (Total Songs) */}
        <div className="w-full md:w-[55%] flex flex-col justify-center items-center md:items-start text-center md:text-left shrink-0">
          <p className={`text-[10px] font-sans font-medium tracking-[0.25em] uppercase mb-4 ${labelColor}`}>
            Total Songs
          </p>
          <div className="relative leading-none">
            {/* Extremely large total tracks number with refined premium fade gradient and ultra-subtle grain */}
            <span 
              className="font-display select-none tracking-tighter"
              style={{
                ...textGradientStyle,
                fontSize: 'clamp(8rem, 25vw, 24rem)'
              }}
            >
              <AnimatedCounter value={totalTracks} />
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: 40-45% width - Clean Two-Column Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full md:w-[40%] grid grid-cols-1 sm:grid-cols-2 gap-x-8 md:gap-x-12 gap-y-8 md:gap-y-12 pl-0 md:pl-12 border-t md:border-t-0 md:border-l border-[var(--border)]/15 pt-8 md:pt-0"
        >
          {/* Total Playlists */}
          <motion.div variants={itemVariants} className="flex flex-col">
            <span className={`text-3xl sm:text-4xl font-display font-light tracking-tight leading-none ${numberColor}`}>
              <AnimatedCounter value={playlistCount} />
            </span>
            <span className={`text-[10px] font-sans font-light tracking-[0.18em] uppercase ${labelColor} mt-2.5`}>
              Total Playlists
            </span>
          </motion.div>

          {/* Total Artists */}
          <motion.div variants={itemVariants} className="flex flex-col">
            <span className={`text-3xl sm:text-4xl font-display font-light tracking-tight leading-none ${numberColor}`}>
              <AnimatedCounter value={uniqueArtists} />
            </span>
            <span className={`text-[10px] font-sans font-light tracking-[0.18em] uppercase ${labelColor} mt-2.5`}>
              Total Artists
            </span>
          </motion.div>

          {/* Total Duration */}
          <motion.div variants={itemVariants} className="flex flex-col">
            <span className={`text-3xl sm:text-4xl font-display font-light tracking-tight leading-none ${numberColor}`}>
              {totalDurationStr}
            </span>
            <span className={`text-[10px] font-sans font-light tracking-[0.18em] uppercase ${labelColor} mt-2.5`}>
              Total Duration
            </span>
          </motion.div>

          {/* Total Library Size */}
          <motion.div variants={itemVariants} className="flex flex-col">
            <span className={`text-3xl sm:text-4xl font-display font-light tracking-tight leading-none ${numberColor}`}>
              {totalSizeStr}
            </span>
            <span className={`text-[10px] font-sans font-light tracking-[0.18em] uppercase ${labelColor} mt-2.5`}>
              Total Library Size
            </span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};
