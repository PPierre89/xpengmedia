import React, { useEffect, useState } from 'react';

interface PlatformIconProps {
  icon: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Palette de repli, dans les teintes de l'interface. La couleur est choisie de
// façon déterministe à partir du nom du service : un même service garde donc
// toujours la même vignette.
const FALLBACK_COLORS = [
  'from-cyan-500 to-blue-600',
  'from-blue-500 to-indigo-600',
  'from-indigo-500 to-violet-600',
  'from-violet-500 to-fuchsia-600',
  'from-rose-500 to-orange-500',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-teal-500 to-cyan-600',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Initiales du service, en ignorant les drapeaux emoji des noms régionaux. */
function initials(name: string): string {
  const words = name
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  icon,
  name,
  size = 'md',
  className = '',
}) => {
  // Tailles RÉDUITES pour mobile Z50S Pro (grille 5 colonnes)
  const sizeClasses = {
    sm: 'w-11 h-11 min-w-[2.75rem] min-h-[2.75rem]',  // 44px - Compact mobile
    md: 'w-13 h-13 min-w-[3.25rem] min-h-[3.25rem]',  // 52px - Normal
    lg: 'w-16 h-16 min-w-[4rem] min-h-[4rem]',        // 64px - Grand
  };

  // Taille d'emoji réduite pour mobile
  const emojiSize = {
    sm: 'text-[1.375rem]', // 22px - Compact
    md: 'text-[1.625rem]', // 26px
    lg: 'text-[1.875rem]', // 30px
  };

  // Taille d'image pour logos réels - réduite mobile
  const imageSize = {
    sm: 'w-8 h-8',   // 32px - Compact mobile
    md: 'w-10 h-10', // 40px
    lg: 'w-12 h-12', // 48px
  };

  const fallbackTextSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Détecter si c'est une URL (logo) ou un emoji
  const isUrl =
    icon.startsWith('http') ||
    icon.startsWith('/') ||
    icon.startsWith('data:') ||
    icon.startsWith('icons/');

  // Un logo peut manquer si un favori enregistré pointe vers une ancienne URL.
  // On affiche alors un monogramme aux couleurs de l'interface plutôt qu'une
  // image cassée.
  const [hasFailed, setHasFailed] = useState(false);
  useEffect(() => setHasFailed(false), [icon]);

  const showFallback = isUrl && hasFailed;
  const fallbackColor = FALLBACK_COLORS[hashString(name) % FALLBACK_COLORS.length];

  return (
    <div
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        rounded-xl
        bg-white/80
        dark:bg-white/10
        backdrop-blur-sm
        border border-slate-200/70 dark:border-slate-700/50
        shadow-sm
        transition-all duration-200
        group-hover:scale-105
        group-hover:shadow-lg
        group-hover:border-slate-300 dark:group-hover:border-slate-600
        ${className}
      `}
      aria-hidden="true"
    >
      {showFallback ? (
        // Repli : monogramme du service
        <span
          className={`
            ${imageSize[size]}
            ${fallbackTextSize[size]}
            flex items-center justify-center
            rounded-lg
            bg-gradient-to-br ${fallbackColor}
            font-bold text-white
          `}
        >
          {initials(name)}
        </span>
      ) : isUrl ? (
        // Logo réel EN COULEUR avec fond transparent
        <img
          src={icon}
          alt={name || 'Service logo'}
          className={`
            ${imageSize[size]}
            object-contain
            transition-all
            duration-200
            p-0.5
          `}
          style={{
            filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.15))',
            imageRendering: 'crisp-edges',
          }}
          loading="lazy"
          onError={() => setHasFailed(true)}
        />
      ) : (
        // Emoji (comportement actuel)
        <span className={`flex items-center justify-center leading-none ${emojiSize[size]}`}>
          {icon}
        </span>
      )}
    </div>
  );
};
