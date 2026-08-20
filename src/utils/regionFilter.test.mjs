import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  videoCategories,
  musicCategories,
  gamesCategories,
  chargingCategories,
  otherServicesCategories,
} from '../data/platforms.ts';
import { regionsMetadata } from '../data/regionsMetadata.ts';
import { countServicesForRegion, filterPlatformsByRegion } from './regionFilter.ts';

const allPlatforms = [
  videoCategories,
  musicCategories,
  gamesCategories,
  chargingCategories,
  otherServicesCategories,
]
  .flat()
  .flatMap((category) => category.platforms);

const visibleIn = (region) => new Set(filterPlatformsByRegion(allPlatforms, region).map((s) => s.id));

/** Vrai si le service est proposé quand la région est réglée sur `region`. */
const shows = (region, id) => visibleIn(region).has(id);

describe('filtrage par région', () => {
  test('un service national reste dans son pays', () => {
    // La règle : une application française ne doit pas apparaître quand la
    // région est réglée sur l'Allemagne.
    assert.equal(shows('france', 'tf1plus'), true);
    assert.equal(shows('germany', 'tf1plus'), false);
    assert.equal(shows('germany', 'canal-plus'), false);
    assert.equal(shows('spain', 'francetv'), false);

    // Et réciproquement.
    assert.equal(shows('germany', 'ard-mediathek'), true);
    assert.equal(shows('france', 'ard-mediathek'), false);
  });

  test('un service binational apparaît dans ses deux pays, pas ailleurs', () => {
    // Arte est une chaîne franco-allemande.
    assert.equal(shows('france', 'arte'), true);
    assert.equal(shows('germany', 'arte'), true);
    assert.equal(shows('spain', 'arte'), false);
    assert.equal(shows('usa', 'arte'), false);
  });

  test('les voisins ne partagent pas leurs chaînes nationales', () => {
    assert.equal(shows('belgium', 'rtbf'), true);
    assert.equal(shows('france', 'rtbf'), false);

    assert.equal(shows('switzerland', 'rtsplay'), true);
    assert.equal(shows('france', 'rtsplay'), false);
    assert.equal(shows('germany', 'rtsplay'), false);

    assert.equal(shows('sweden', 'svt-play'), true);
    assert.equal(shows('denmark', 'svt-play'), false);
    assert.equal(shows('norway', 'svt-play'), false);
  });

  test('un service mondial est proposé partout sauf en Chine', () => {
    for (const region of ['france', 'germany', 'sweden', 'usa', 'australia', 'uae']) {
      assert.equal(shows(region, 'netflix'), true, `netflix devrait être visible en ${region}`);
    }
    // La Chine n'accepte pas `global` : les services mondiaux y sont bloqués.
    assert.equal(shows('china', 'netflix'), false);
    assert.equal(shows('china', 'bilibili'), true);
  });

  test('un service pan-européen couvre toute l’Europe et rien d’autre', () => {
    for (const region of ['france', 'germany', 'sweden', 'uk', 'finland']) {
      assert.equal(shows(region, 'chargemap'), true, `chargemap devrait être visible en ${region}`);
    }
    assert.equal(shows('usa', 'chargemap'), false);
    assert.equal(shows('australia', 'chargemap'), false);
  });

  test('chaque scope national correspond à une région existante', () => {
    // Sans quoi un service serait dans le catalogue sans être visible nulle
    // part — le cas qui a rendu la région Finlande nécessaire.
    const regionCodes = new Set(regionsMetadata.map((r) => r.code));
    const broad = new Set(['global', 'europe', 'north-america', 'asia', 'china', 'australia', 'middle-east']);

    for (const scope of new Set(allPlatforms.flatMap((s) => s.availability))) {
      if (broad.has(scope)) continue;
      assert.ok(regionCodes.has(scope), `le scope « ${scope} » ne correspond à aucune région`);
    }
  });

  test('aucun service n’est invisible depuis toutes les régions', () => {
    const seen = new Set();
    for (const region of regionsMetadata) {
      for (const id of visibleIn(region.code)) seen.add(id);
    }
    const orphans = allPlatforms.filter((s) => !seen.has(s.id)).map((s) => `${s.id} [${s.availability}]`);
    assert.deepEqual(orphans, []);
  });

  test('les régions européennes ne sont plus interchangeables', () => {
    // Elles affichaient toutes exactement le même nombre de services, les
    // scopes nationaux étant systématiquement doublés d'un scope `europe`.
    const counts = ['france', 'germany', 'spain', 'sweden'].map(countServicesForRegion);
    assert.equal(new Set(counts).size, counts.length);
  });

  test('le comptage par région est celui du filtre', () => {
    for (const region of regionsMetadata) {
      assert.equal(
        countServicesForRegion(region.code),
        filterPlatformsByRegion(allPlatforms, region.code).length,
        `comptage incohérent pour ${region.code}`
      );
    }
  });
});
