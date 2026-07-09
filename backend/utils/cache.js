/**
 * Simple cache with TTL support
 * ponytail: Replaced CacheManager class (145 lines) with native Map
 */

class SimpleCache {
  constructor() {
    this.store = new Map();
    this.timers = new Map();
  }

  get(key) {
    return this.store.get(key) ?? null;
  }

  set(key, value, ttl = 3600000) {
    this.store.set(key, value);
    
    if (this.timers.has(key)) clearTimeout(this.timers.get(key));
    
    if (ttl) {
      const timer = setTimeout(() => {
        this.store.delete(key);
        this.timers.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }
  }

  delete(key) {
    if (this.timers.has(key)) clearTimeout(this.timers.get(key));
    return this.store.delete(key);
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.store.clear();
    this.timers.clear();
  }

  getStats() {
    return {
      size: this.store.size,
      message: 'Use a real cache service (Redis) for production metrics'
    };
  }
}

module.exports = new SimpleCache();
