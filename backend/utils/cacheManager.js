/**
 * Cache Manager com Hit/Miss Tracking
 * Oferece sistema de cache simples com métricas
 */

const logger = require('../utils/logger');

class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
    this.ttlMap = new Map(); // Para rastrear TTL
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hora
  }

  /**
   * Obter valor do cache
   */
  get(key, requestId = null) {
    const now = Date.now();
    
    if (this.cache.has(key)) {
      const ttl = this.ttlMap.get(key);
      
      // Verificar se expirou
      if (ttl && now > ttl) {
        this.cache.delete(key);
        this.ttlMap.delete(key);
        this.stats.misses++;
        
        logger.debug(`Cache MISS (expired)`, {
          requestId,
          key,
        });
        
        return null;
      }
      
      this.stats.hits++;
      logger.debug(`Cache HIT`, {
        requestId,
        key,
      });
      
      return this.cache.get(key);
    }
    
    this.stats.misses++;
    logger.debug(`Cache MISS`, {
      requestId,
      key,
    });
    
    return null;
  }

  /**
   * Adicionar valor ao cache
   */
  set(key, value, ttl = this.defaultTTL, requestId = null) {
    this.cache.set(key, value);
    
    if (ttl) {
      this.ttlMap.set(key, Date.now() + ttl);
    }
    
    this.stats.sets++;
    
    logger.debug(`Cache SET`, {
      requestId,
      key,
      ttl,
    });
  }

  /**
   * Deletar valor do cache
   */
  delete(key, requestId = null) {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.ttlMap.delete(key);
      this.stats.deletes++;
      
      logger.debug(`Cache DELETE`, {
        requestId,
        key,
      });
    }
    
    return deleted;
  }

  /**
   * Limpar todo o cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.ttlMap.clear();
    
    logger.info(`Cache cleared`, {
      itemsCleared: size,
    });
  }

  /**
   * Obter estatísticas de cache
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : '0.00';
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
      total,
    };
  }

  /**
   * Resetar estatísticas
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }
}

// Instância global de cache
const cacheManager = new CacheManager();

module.exports = cacheManager;
