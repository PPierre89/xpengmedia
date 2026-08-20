// Filtrage des services selon la région sélectionnée.
//
// Les extensions `.ts` sont explicites pour que `node --test` puisse importer
// ce module directement (voir regionFilter.test.mjs) : Node ne résout pas les
// imports sans extension, contrairement à Vite.
import type { Region } from '../data/regionsMetadata.ts';
import type { AvailabilityScope, PlatformLink } from '../data/platforms.ts';
import {
  videoCategories,
  musicCategories,
  gamesCategories,
  chargingCategories,
  otherServicesCategories,
} from '../data/platforms.ts';

// Ce qu'une région accepte : les services mondiaux, les services réellement
// pan-européens, et ceux de son propre pays. Rien d'autre.
//
// Un service national n'est visible que dans son pays : une chaîne française
// n'apparaît pas quand la région est réglée sur l'Allemagne. Les scopes de
// groupe (`western_europe`, `northern_europe`, `anglophone`) ont été retirés :
// tous les services qui les portaient portaient aussi `europe`, ils n'avaient
// donc aucun effet et les 12 régions européennes affichaient la même liste.
const regionToAvailabilityMap: Record<Region, AvailabilityScope[]> = {
  global: ['global'],

  // Europe : mondial + pan-européen + national
  france: ['global', 'europe', 'france'],
  belgium: ['global', 'europe', 'belgium'],
  switzerland: ['global', 'europe', 'switzerland'],
  spain: ['global', 'europe', 'spain'],
  italy: ['global', 'europe', 'italy'],
  germany: ['global', 'europe', 'germany'],
  austria: ['global', 'europe', 'austria'],
  netherlands: ['global', 'europe', 'netherlands'],
  sweden: ['global', 'europe', 'sweden'],
  norway: ['global', 'europe', 'norway'],
  denmark: ['global', 'europe', 'denmark'],
  uk: ['global', 'europe', 'uk'],

  // Hors d'Europe
  usa: ['global', 'north-america'],
  australia: ['global', 'australia'],
  singapore: ['global', 'asia'],

  // Chine continentale : pas de `global`, la plupart des services mondiaux y
  // étant inaccessibles. Uniquement ce qui est marqué `asia` ou `china`.
  china: ['asia', 'china'],

  uae: ['global', 'middle-east'],
  qatar: ['global', 'middle-east'],
  israel: ['global', 'middle-east'],
};

/**
 * Ne garde que les services disponibles dans la région donnée : les services
 * mondiaux, les pan-européens si la région est en Europe, et ceux du pays.
 */
export function filterPlatformsByRegion(platforms: PlatformLink[], userRegion: Region): PlatformLink[] {
  const accepted = regionToAvailabilityMap[userRegion] ?? ['global'];

  return platforms.filter((platform) =>
    platform.availability.some((scope) => accepted.includes(scope))
  );
}

// Catalogue complet, à plat : sert au comptage par région.
const allPlatforms: PlatformLink[] = [
  videoCategories,
  musicCategories,
  gamesCategories,
  chargingCategories,
  otherServicesCategories,
]
  .flat()
  .flatMap((category) => category.platforms);

// Le catalogue est statique : le comptage n'est fait qu'une fois par région.
const serviceCountCache = new Map<Region, number>();

/**
 * Nombre total de services du catalogue disponibles dans une région.
 * Utilisé par le sélecteur de région pour afficher un badge par pays.
 */
export function countServicesForRegion(userRegion: Region): number {
  const cached = serviceCountCache.get(userRegion);
  if (cached !== undefined) return cached;

  const count = filterPlatformsByRegion(allPlatforms, userRegion).length;
  serviceCountCache.set(userRegion, count);
  return count;
}
