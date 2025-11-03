/**
 * DependencyContainer - Manages dependency injection for all bot systems
 * Solves circular dependency issues and enables testing
 */
class DependencyContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.factories = new Map();
  }

  /**
   * Register a singleton service
   */
  registerSingleton(name, instance) {
    if (this.singletons.has(name)) {
      console.warn(`⚠️  Singleton '${name}' already registered, overwriting`);
    }
    this.singletons.set(name, instance);
  }

  /**
   * Register a factory function
   */
  registerFactory(name, factory) {
    this.factories.set(name, factory);
  }

  /**
   * Get a service by name
   */
  get(name) {
    // Check singletons first
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Check factories
    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      const instance = factory(this);
      this.singletons.set(name, instance);
      return instance;
    }

    throw new Error(`Service '${name}' not registered`);
  }

  /**
   * Check if service exists
   */
  has(name) {
    return this.singletons.has(name) || this.factories.has(name);
  }

  /**
   * Clear all services (for testing)
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
    this.factories.clear();
  }

  /**
   * Get all registered service names
   */
  listServices() {
    const all = new Set([
      ...this.singletons.keys(),
      ...this.factories.keys()
    ]);
    return Array.from(all).sort();
  }
}

module.exports = DependencyContainer;
