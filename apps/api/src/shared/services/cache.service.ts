/**
 * FICHIER: apps/api/src/shared/services/cache.service.ts
 * SERVICE: Cache - Service de mise en cache en mémoire
 *
 * DESCRIPTION:
 * Service simple de cache en mémoire avec TTL (Time To Live)
 * Pour production, remplacer par Redis
 *
 * FONCTIONNALITÉS:
 * - Stockage clé-valeur en mémoire
 * - TTL configurable par entrée
 * - Nettoyage automatique des entrées expirées
 * - Statistiques de cache (hits/misses)
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private hits: number = 0;
  private misses: number = 0;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes par défaut

  /**
   * Récupère une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Vérifier si l'entrée est expirée
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Supprime toutes les entrées correspondant à un pattern
   */
  deletePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Récupère les statistiques du cache
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0
    };
  }

  /**
   * Helper pour wrapping une fonction avec cache
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Vérifier si la valeur est en cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Exécuter la fonction et mettre en cache
    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }

  /**
   * Configure le TTL par défaut
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }
}

// Instance singleton
export const cacheService = new CacheService();

// Nettoyage automatique toutes les 10 minutes
setInterval(() => {
  const cleaned = cacheService.cleanup();
  if (cleaned > 0) {
    console.log(`[Cache] Nettoyage: ${cleaned} entrées expirées supprimées`);
  }
}, 10 * 60 * 1000);
