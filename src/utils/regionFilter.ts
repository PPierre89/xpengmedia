// Utilitaire pour filtrer les services selon la région sélectionnée
import type { Region } from '../data/regionsMetadata';
import type { PlatformLink } from '../data/platforms';
import {
  videoCategories,
  musicCategories,
  gamesCategories,
  chargingCategories,
  otherServicesCategories,
} from '../data/platforms';

// Mapping des régions vers leurs groupes d'availability
// IMPORTANT : utiliser uniquement des valeurs réellement présentes dans AvailabilityScope
// pour garantir que le filtrage renvoie bien les bons services.
const regionToAvailabilityMap: Record<Region, string[]> = {
  global: ['global'],

  // Europe de l'Ouest
  france: ['global', 'europe', 'western_europe', 'france'],
  spain: ['global', 'europe', 'western_europe', 'spain'],
  italy: ['global', 'europe', 'western_europe', 'italy'],
  belgium: ['global', 'europe', 'western_europe'],

  // Europe centre / nord
  germany: ['global', 'europe', 'northern_europe', 'germany'],
  austria: ['global', 'europe', 'northern_europe'],
  switzerland: ['global', 'europe', 'northern_europe'],
  netherlands: ['global', 'europe', 'northern_europe'],
  sweden: ['global', 'europe', 'northern_europe'],
  norway: ['global', 'europe', 'northern_europe'],
  denmark: ['global', 'europe', 'northern_europe'],

  // Anglophones
  uk: ['global', 'europe', 'anglophone', 'uk'],
  usa: ['global', 'north-america', 'anglophone'],
  australia: ['global', 'australia', 'anglophone'],

  // Asie
  // Chine continentale : on NE prend PAS 'global' pour éviter les services bloqués,
  // uniquement les services marqués explicitement 'asia' ou 'china'.
  china: ['asia', 'china'],
  // Autres régions asiatiques gardent 'global' + 'asia'.
  singapore: ['global', 'asia', 'anglophone'],

  // Moyen-Orient
  uae: ['global', 'middle-east'],
  qatar: ['global', 'middle-east'],
  israel: ['global', 'middle-east'],
};

/**
 * Filtre les services disponibles pour une région donnée
 * Inclut TOUJOURS les services globaux + les services de la région
 */
export function filterPlatformsByRegion(platforms: PlatformLink[], userRegion: Region): PlatformLink[] {
  // Récupérer les availability acceptables pour cette région
  const acceptedAvailability = regionToAvailabilityMap[userRegion] || ['global'];

  return platforms.filter((platform) =>
    platform.availability.some((avail: string) => acceptedAvailability.includes(avail))
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
