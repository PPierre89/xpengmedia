import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '../../context/LocaleContext';
import type { Region } from '../../data/regionsMetadata';
import { getRegionSections } from '../../data/regionsMetadata';
import type { RegionSectionId } from '../../data/regionsMetadata';
import { countServicesForRegion } from '../../utils/regionFilter';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

const SECTION_LABEL_KEYS: Record<RegionSectionId, string> = {
  global: 'regionSectionGlobal',
  suggested: 'regionSectionSuggested',
  others: 'regionSectionOthers',
};

export const LocaleSelector: React.FC = () => {
  const { locale, setLocale, availableRegions, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const defaultRegion: { code: Region; name: string; flag: string; language: string } = {
    code: 'global',
    name: 'Global',
    flag: '🌍',
    language: 'en',
  };

  const currentRegion =
    availableRegions.find((r) => r.code === locale.region) || availableRegions[0] || defaultRegion;

  // Regroupement en trois sections : Global, Suggérés (voisins de la région
  // courante) puis Autres. Chaque entrée porte le nombre de services du
  // catalogue réellement disponibles dans le pays.
  const sections = useMemo(() => {
    const byCode = new Map(availableRegions.map((region) => [region.code, region]));

    return getRegionSections(
      locale.region,
      availableRegions.map((region) => region.code)
    ).map((section) => ({
      id: section.id,
      regions: section.regions
        .map((code) => byCode.get(code))
        .filter((region): region is (typeof availableRegions)[number] => Boolean(region))
        .map((region) => ({ ...region, serviceCount: countServicesForRegion(region.code) })),
    }));
  }, [availableRegions, locale.region]);

  const currentServiceCount = countServicesForRegion(currentRegion.code);

  // Calculer la position du bouton
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (regionCode: Region, language: string) => {
    setLocale({ region: regionCode, language });
    setIsOpen(false);
  };

  // Rendre le dropdown dans un portail
  const dropdownContent = isOpen && (
          <>
            {/* Overlay pour bloquer les interactions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[99998] bg-black/40 backdrop-blur-sm"
            />

            {/* Menu déroulant */}
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: `${buttonPosition.top}px`,
                right: `${buttonPosition.right}px`,
                maxHeight: '80vh',
              }}
              className="z-[99999] w-80 rounded-2xl border-4 border-cyan-500 bg-white shadow-[0_0_80px_10px_rgba(6,182,212,0.6)] dark:bg-slate-900"
            >
            <div className="p-2">
              <div className="mb-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('selectRegion')}
              </div>
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {sections.map((section) => (
                  <div key={section.id}>
                    <div className="px-3 pb-1 text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t(SECTION_LABEL_KEYS[section.id])}
                    </div>
                    <div className="space-y-1">
                      {section.regions.map((region) => {
                        const isSelected = region.code === locale.region;
                        return (
                          <motion.button
                            key={region.code}
                            onClick={() => handleSelect(region.code, region.language)}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-600 shadow-sm dark:text-cyan-400'
                                : 'text-slate-700 hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-800/80'
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="text-2xl" aria-hidden="true">{region.flag}</span>
                              <div className="min-w-0">
                                <div className="truncate font-medium">{region.name}</div>
                                {region.code === 'global' && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('allServices')}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                                  isSelected
                                    ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                                aria-label={`${region.serviceCount} ${t('servicesLabel')}`}
                              >
                                {region.serviceCount}
                              </span>
                              {isSelected && (
                                <CheckIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          </>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-cyan-400 hover:bg-white hover:shadow-md dark:border-slate-700/70 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:bg-slate-800"
      >
        <span className="text-xl" aria-hidden="true">{currentRegion.flag}</span>
        <span className="hidden sm:inline">{currentRegion.name}</span>
        <span
          className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600 sm:inline dark:bg-slate-700 dark:text-slate-300"
          aria-label={`${currentServiceCount} ${t('servicesLabel')}`}
        >
          {currentServiceCount}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {dropdownContent && createPortal(
        <AnimatePresence>
          {dropdownContent}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
