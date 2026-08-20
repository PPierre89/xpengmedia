/**
 * Petit magasin JSON persistant — zéro dépendance.
 *
 * Sert à la fois la synchronisation (documents de l'utilisateur) et
 * l'intégration véhicule (identifiants du compte constructeur). Les données
 * vivent dans un seul dossier, monté en volume Docker, sur le NAS de
 * l'utilisateur : rien ne quitte la machine.
 *
 * Écriture atomique : on écrit dans un fichier temporaire du même dossier puis
 * on `rename()`. Une coupure de courant en plein `docker compose down` laisse
 * donc soit l'ancien document intact, soit le nouveau complet, jamais un JSON
 * tronqué qui empêcherait l'application de redémarrer.
 *
 * Les écritures d'un même document sont sérialisées par une chaîne de
 * promesses : deux requêtes simultanées ne peuvent pas s'écraser l'une l'autre
 * en lisant toutes les deux l'état d'avant.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

/** Les identifiants ne sont lisibles que par l'utilisateur du conteneur. */
const SECRET_FILE_MODE = 0o600;
const DIR_MODE = 0o700;

export class JsonStore {
  /**
   * @param {string} dir Dossier de données (créé si absent).
   */
  constructor(dir) {
    this.dir = path.resolve(dir);
    /** @type {Map<string, Promise<unknown>>} file d'attente par document */
    this.queues = new Map();
    this.ready = false;
  }

  async init() {
    if (this.ready) return;
    await fsp.mkdir(this.dir, { recursive: true, mode: DIR_MODE });
    this.ready = true;
  }

  /** Refuse tout nom de document qui pourrait sortir du dossier de données. */
  #fileFor(name) {
    if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(name) || name.includes('..')) {
      throw new Error(`nom de document invalide : ${name}`);
    }
    return path.join(this.dir, `${name}.json`);
  }

  /**
   * Lit un document. Renvoie `fallback` si le fichier n'existe pas ou s'il est
   * illisible : un document corrompu ne doit pas empêcher le serveur de
   * démarrer, la synchronisation repartira du contenu des clients.
   */
  async read(name, fallback = null) {
    await this.init();
    const file = this.#fileFor(name);
    try {
      return JSON.parse(await fsp.readFile(file, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`[store] « ${name} » illisible (${error.message}), valeur par défaut utilisée`);
      }
      return fallback;
    }
  }

  /** Écrit un document de façon atomique. */
  async write(name, value, { secret = false } = {}) {
    await this.init();
    const file = this.#fileFor(name);
    const temporary = `${file}.${crypto.randomBytes(6).toString('hex')}.tmp`;
    const body = JSON.stringify(value, null, 2);

    await fsp.writeFile(temporary, body, { mode: secret ? SECRET_FILE_MODE : 0o644 });
    await fsp.rename(temporary, file);
    if (secret) await fsp.chmod(file, SECRET_FILE_MODE).catch(() => {});
    return value;
  }

  async remove(name) {
    await this.init();
    try {
      await fsp.unlink(this.#fileFor(name));
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  }

  /**
   * Lit, transforme, écrit — en série par document.
   *
   * `mutator` reçoit l'état courant et renvoie le nouvel état ; sa valeur de
   * retour est aussi celle de `update()`. Tant qu'une mise à jour du même
   * document est en cours, la suivante attend : deux `POST /api/sync`
   * simultanés fusionnent donc l'un après l'autre au lieu de se perdre.
   */
  async update(name, fallback, mutator, options) {
    const previous = this.queues.get(name) ?? Promise.resolve();
    const next = previous.then(
      async () => {
        const current = await this.read(name, fallback);
        const updated = await mutator(current);
        await this.write(name, updated, options);
        return updated;
      },
      async () => {
        // L'échec de l'opération précédente ne doit pas bloquer la file.
        const current = await this.read(name, fallback);
        const updated = await mutator(current);
        await this.write(name, updated, options);
        return updated;
      }
    );

    this.queues.set(name, next);
    try {
      return await next;
    } finally {
      if (this.queues.get(name) === next) this.queues.delete(name);
    }
  }
}

/**
 * Comparaison à temps constant de deux jetons.
 *
 * `===` sur une chaîne s'arrête au premier caractère différent : le temps de
 * réponse laisse alors deviner le jeton caractère par caractère. On hache les
 * deux valeurs pour obtenir des longueurs égales avant de comparer.
 */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

/** Vrai si le dossier est utilisable en écriture (diagnostic de démarrage). */
export function isWritableDir(dir) {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
