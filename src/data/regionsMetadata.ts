import type { Region } from '../context/LocaleContext';

export interface RegionMetadata {
  code: Region;
  name: string;
  flag: string;
  languages: string[];
  group: string;
  neighbors: Region[];
}

export const regionsMetadata: RegionMetadata[] = [
  {
    code: 'global',
    name: 'Global / International',
    flag: '🌍',
    languages: ['en'],
    group: 'global',
    neighbors: [],
  },
  // Europe de l'Ouest (langues latines)
  {
    code: 'france',
    name: 'France',
    flag: '🇫🇷',
    languages: ['fr'],
    group: 'western_europe',
    neighbors: ['belgium', 'switzerland', 'spain', 'italy', 'germany'],
  },
  {
    code: 'spain',
    name: 'España',
    flag: '🇪🇸',
    languages: ['es'],
    group: 'western_europe',
    neighbors: ['france'],
  },
  {
    code: 'italy',
    name: 'Italia',
    flag: '🇮🇹',
    languages: ['it'],
    group: 'western_europe',
    neighbors: ['france', 'switzerland', 'austria'],
  },
  {
    code: 'belgium',
    name: 'België / Belgique',
    flag: '🇧🇪',
    languages: ['nl', 'fr'],
    group: 'western_europe',
    neighbors: ['france', 'netherlands', 'germany'],
  },
  // Europe du Nord (langues germaniques)
  {
    code: 'germany',
    name: 'Deutschland',
    flag: '🇩🇪',
    languages: ['de'],
    group: 'northern_europe',
    neighbors: ['austria', 'switzerland', 'netherlands', 'belgium', 'france'],
  },
  {
    code: 'austria',
    name: 'Österreich',
    flag: '🇦🇹',
    languages: ['de'],
    group: 'northern_europe',
    neighbors: ['germany', 'switzerland', 'italy'],
  },
  {
    code: 'switzerland',
    name: 'Schweiz / Suisse',
    flag: '🇨🇭',
    languages: ['de', 'fr', 'it'],
    group: 'northern_europe',
    neighbors: ['france', 'germany', 'austria', 'italy'],
  },
  {
    code: 'netherlands',
    name: 'Nederland',
    flag: '🇳🇱',
    languages: ['nl'],
    group: 'northern_europe',
    neighbors: ['belgium', 'germany'],
  },
  // Europe du Nord (scandinave)
  {
    code: 'sweden',
    name: 'Sverige',
    flag: '🇸🇪',
    languages: ['sv'],
    group: 'nordic',
    neighbors: ['norway', 'denmark'],
  },
  {
    code: 'norway',
    name: 'Norge',
    flag: '🇳🇴',
    languages: ['no'],
    group: 'nordic',
    neighbors: ['sweden', 'denmark'],
  },
  {
    code: 'denmark',
    name: 'Danmark',
    flag: '🇩🇰',
    languages: ['da'],
    group: 'nordic',
    neighbors: ['sweden', 'norway', 'germany'],
  },
  // Pays anglophones
  {
    code: 'uk',
    name: 'United Kingdom',
    flag: '🇬🇧',
    languages: ['en'],
    group: 'anglophone',
    neighbors: [],
  },
  {
    code: 'usa',
    name: 'United States',
    flag: '🇺🇸',
    languages: ['en'],
    group: 'anglophone',
    neighbors: [],
  },
  {
    code: 'australia',
    name: 'Australia',
    flag: '🇦🇺',
    languages: ['en'],
    group: 'anglophone',
    neighbors: [],
  },
  {
    code: 'singapore',
    name: 'Singapore',
    flag: '🇸🇬',
    languages: ['en', 'zh'],
    group: 'asia',
    neighbors: [],
  },
  // Moyen-Orient
  {
    code: 'uae',
    name: 'UAE الإمارات',
    flag: '🇦🇪',
    languages: ['ar'],
    group: 'middle_east',
    neighbors: ['qatar'],
  },
  {
    code: 'qatar',
    name: 'Qatar قطر',
    flag: '🇶🇦',
    languages: ['ar'],
    group: 'middle_east',
    neighbors: ['uae'],
  },
  {
    code: 'israel',
    name: 'Israel ישראל',
    flag: '🇮🇱',
    languages: ['he', 'ar'],
    group: 'middle_east',
    neighbors: [],
  },
  // Asie
  {
    code: 'china',
    name: '中国 China',
    flag: '🇨🇳',
    languages: ['zh'],
    group: 'asia',
    neighbors: ['singapore'],
  },
];

export function getSuggestedRegions(currentRegion: Region): Region[] {
  const metadata = regionsMetadata.find(r => r.code === currentRegion);
  if (!metadata) return [];
  
  const suggestions = new Set<Region>();
  
  // Priorité 1 : Voisins directs
  metadata.neighbors.forEach(n => suggestions.add(n));
  
  // Priorité 2 : Même groupe (sauf le pays actuel)
  regionsMetadata
    .filter(r => r.group === metadata.group && r.code !== currentRegion)
    .forEach(r => suggestions.add(r.code));
  
  return Array.from(suggestions);
}

export type RegionSectionId = 'global' | 'suggested' | 'others';

export interface RegionSection {
  id: RegionSectionId;
  regions: Region[];
}

/**
 * Découpe la liste des régions en trois sections pour le sélecteur :
 *
 *   global     : le catalogue international, toujours en premier ;
 *   suggested  : la région courante puis ses voisins / son groupe linguistique ;
 *   others     : le reste, par ordre alphabétique.
 *
 * `availableRegions` est la liste réellement proposée par l'application : une
 * région décrite ici mais absente de cette liste est ignorée. Les sections
 * vides ne sont pas renvoyées.
 */
export function getRegionSections(
  userRegion: Region,
  availableRegions: Region[]
): RegionSection[] {
  const available = new Set(availableRegions);
  const placed = new Set<Region>();

  const take = (code: Region): boolean => {
    if (!available.has(code) || placed.has(code)) return false;
    placed.add(code);
    return true;
  };

  const global: Region[] = take('global') ? ['global'] : [];

  const suggested: Region[] = [];
  if (userRegion !== 'global' && take(userRegion)) suggested.push(userRegion);
  getSuggestedRegions(userRegion)
    .filter((code) => code !== 'global')
    .forEach((code) => {
      if (take(code)) suggested.push(code);
    });

  const nameOf = (code: Region) => regionsMetadata.find((r) => r.code === code)?.name ?? code;
  const others = availableRegions
    .filter((code) => !placed.has(code))
    .sort((a, b) => nameOf(a).localeCompare(nameOf(b)));

  return ([
    { id: 'global', regions: global },
    { id: 'suggested', regions: suggested },
    { id: 'others', regions: others },
  ] as RegionSection[]).filter((section) => section.regions.length > 0);
}
