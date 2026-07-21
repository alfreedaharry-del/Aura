import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Disc3 } from 'lucide-react';
import { CoverArtImage } from '../lib/coverArt';

interface RecordPlayerProps {
  coverUrl?: string;
  isPlaying: boolean;
  sizeClass?: string;
}

export const VinylRecord: React.FC<{ coverUrl?: string; isPlaying: boolean }> = ({ coverUrl, isPlaying }) => {
  return (
    <motion.div
      className="absolute w-48 h-48 md:w-64 md:h-64"
      style={{
        top: '8px',
        left: '8px',
      }}
      animate={{
        x: isPlaying ? '50%' : '0%',
      }}
      transition={{
        type: 'spring',
        damping: 26,
        stiffness: 80,
      }}
    >
      {/* Inner Rotating Disc */}
      <motion.div
        className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center border-[5px] border-neutral-900 overflow-hidden relative shadow-2xl"
        style={{
          backgroundImage: 'repeating-radial-gradient(circle, #1c1c1c, #1c1c1c 2px, #121212 4px, #121212 5px)',
        }}
        animate={{
          rotate: isPlaying ? 360 : 0,
        }}
        transition={
          isPlaying 
            ? { repeat: Infinity, duration: 6, ease: 'linear' } 
            : { duration: 0.8, ease: 'easeOut' }
        }
      >
        {/* Vinyl Gloss Reflection Overlays */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, transparent 45deg, rgba(255,255,255,0.06) 90deg, transparent 135deg, transparent 225deg, rgba(255,255,255,0.06) 270deg, transparent 315deg)',
          }}
        />
        
        {/* Center Label (Album Art miniaturized, perfectly circular) */}
        <div className="w-16 h-16 md:w-22 md:h-22 rounded-full bg-neutral-900 border-4 border-neutral-950 flex items-center justify-center overflow-hidden relative shadow-inner">
          {coverUrl ? (
            <CoverArtImage src={coverUrl} className="pointer-events-none select-none" wrapperClassName="bg-neutral-900" fallbackClassName="bg-neutral-800" />
          ) : (
            <div className="w-full h-full bg-neutral-800" />
          )}
          
          {/* Turntable spindle center hole */}
          <div className="absolute w-4 h-4 rounded-full bg-neutral-950 border border-white/20 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const Tonearm: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  return (
    <motion.div
      className="absolute z-40 pointer-events-none w-20 h-40 md:w-28 md:h-56"
      style={{
        left: 'calc(100% - 24px)', // Positions pivot perfectly at the top-right corner of the sleeve
        top: '12px',
        transformOrigin: '16px 16px', // Rotates precisely around the pivot circle center
        scale: 0.8, // Reduced scale by exactly 20% for optimal elegant proportions
      }}
      animate={{
        // Resting: 0 degrees, pointing straight down along the right edge of the sleeve
        // Playing: -66 degrees, swinging counter-clockwise to the right to land on the outer grooves of the exposed record
        rotate: isPlaying ? -60 : 0,
        y: isPlaying ? 0 : -3, // Clean mechanical lift when stopped
      }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 60,
      }}
    >
      <svg viewBox="0 0 100 180" className="w-full h-full overflow-visible drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
        <defs>
          {/* Subtle metal accents */}
          <linearGradient id="metalSilver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#999" />
            <stop offset="50%" stopColor="#fff" />
            <stop offset="100%" stopColor="#666" />
          </linearGradient>
        </defs>

        {/* Counterweight and Rear Shaft (extending upwards) */}
        <line x1="16" y1="16" x2="16" y2="4" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" />
        <rect x="11" y="-2" width="10" height="7" rx="1" fill="#f5f5f5" stroke="#e5e5e5" strokeWidth="0.8" />

        {/* Soft Shadow Underlay for the tonearm shaft */}
        <path 
          d="M 16 16 L 16 135 L 22 150" 
          fill="none" 
          stroke="rgba(0,0,0,0.3)" 
          strokeWidth="4" 
          strokeLinecap="round" 
          transform="translate(1, 3)" 
        />

        {/* Slim, Minimalist Matte White Main Shaft */}
        <path 
          d="M 16 16 L 16 135 L 22 150" 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        
        {/* Subtle center silver highlight inside the matte white tube for material depth */}
        <path 
          d="M 16 16 L 16 135 L 22 150" 
          fill="none" 
          stroke="#e5e5e5" 
          strokeWidth="0.8" 
          strokeLinecap="round" 
        />

        {/* Elegant Cartridge & Stylus Assembly */}
        <g transform="translate(22, 150) rotate(15)">
          {/* Matte White Minimalist Headshell */}
          <rect x="-3" y="0" width="6" height="15" rx="0.5" fill="#ffffff" stroke="#f0f0f0" strokeWidth="0.8" />
          {/* Metallic Silver cartridge mount */}
          <rect x="-1.5" y="8" width="3" height="5" fill="url(#metalSilver)" />
          {/* Tiny Green LED power indicator glow */}
          <circle cx="0" cy="13.5" r="0.7" fill="#22c55e" />
        </g>

        {/* Brushed Pivot Base Assembly */}
        <circle cx="16" cy="16" r="10" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="1" />
        <circle cx="16" cy="16" r="6" fill="#ffffff" stroke="#e5e5e5" strokeWidth="1" />
        <circle cx="16" cy="16" r="2" fill="url(#metalSilver)" />
      </svg>
    </motion.div>
  );
};

export const RecordPlayer: React.FC<RecordPlayerProps> = ({ 
  coverUrl, 
  isPlaying 
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    setIsMobile(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  return (
    <div className="relative w-full h-56 md:h-72 flex items-center justify-center overflow-visible select-none">
      {/* SVG ClipPath Definition for the Thumb Cut-Out on the right edge of the sleeve */}
      <svg className="absolute w-0 h-0" width="0" height="0">
        <defs>
          <clipPath id="sleeve-clip" clipPathUnits="objectBoundingBox">
            {/* Creates a clean vertical right-edge semicircle thumb cutout */}
            <path d="M 0,0 L 1,0 L 1,0.38 C 0.94,0.38 0.94,0.62 1,0.62 L 1,1 L 0,1 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Outer Sleeve Container (Relative aspect-square wrapper) */}
      <motion.div 
        className="relative w-52 h-52 md:w-68 md:h-68 shrink-0 z-10 rounded-none border border-white/5"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
        animate={{
          // Moves slightly to the left to perfectly balance the composition when the vinyl slides out
          // On mobile, -44px is mathematically the perfect offset to keep sleeve+vinyl centered
          x: isPlaying ? (isMobile ? -44 : '-25%') : 0,
        }}
        transition={{
          type: 'spring',
          damping: 26,
          stiffness: 80,
        }}
      >
        {/* Soft, deep 3D drop shadow layered behind the sleeve */}
        <div 
          className="absolute inset-0 z-0 bg-transparent rounded-none pointer-events-none transition-shadow duration-500"
          style={{
            boxShadow: isPlaying 
              ? '0 35px 85px rgba(0,0,0,0.92), 0 15px 35px rgba(0,0,0,0.75)'
              : '0 25px 65px rgba(0,0,0,0.85), 0 10px 25px rgba(0,0,0,0.65)',
          }}
        />
        
        {/* Cardboard Sleeve Back Pocket */}
        <div className="absolute inset-0 z-10 bg-neutral-950 rounded-none overflow-hidden">
          {/* Shadow representing dark sleeve interior cavity */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-transparent" />
        </div>

        {/* Vinyl Record sliding out from between back and front pocket layers */}
        <VinylRecord coverUrl={coverUrl} isPlaying={isPlaying} />

        {/* Cardboard Sleeve Front Cover (Perfect 90-degree corners, premium depth) */}
        <div 
          className="absolute inset-0 z-30 bg-neutral-900 border border-white/10 overflow-hidden rounded-none shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.15)]"
          style={{
            clipPath: 'url(#sleeve-clip)',
          }}
        >
          {coverUrl ? (
            <CoverArtImage src={coverUrl} className="pointer-events-none select-none" wrapperClassName="bg-neutral-900" fallbackClassName="bg-neutral-800" />
          ) : (
            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
              <Disc3 size={48} className="text-neutral-600 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
          )}
          
          {/* Realistic cardboard texture overlays */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/5 pointer-events-none mix-blend-overlay z-10" />
          
          {/* Cardboard thickness spine edge highlights */}
          <div className="absolute inset-y-0 left-0 w-[1.5px] bg-white/20 pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-white/20 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-black/50 pointer-events-none" />
        </div>

        {/* Semicircle cutout inner 3D depth rim shadow/highlight */}
        <div 
          className="absolute right-[-1px] top-1/2 -translate-y-1/2 w-4 h-10 border-l border-y border-white/15 rounded-l-full bg-neutral-950/60 pointer-events-none z-35 shadow-inner"
        />

        {/* Highlight lines to simulate card thickness and light reflection */}
        <div className="absolute inset-0 border border-white/5 pointer-events-none z-35" />
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-35" />
        <div className="absolute left-0 inset-y-0 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none z-35" />

        {/* Tonearm pivots directly from the top-right corner of the Sleeve Front */}
        <Tonearm isPlaying={isPlaying} />
      </motion.div>
    </div>
  );
};
