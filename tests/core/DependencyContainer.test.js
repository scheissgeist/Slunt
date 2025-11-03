const DependencyContainer = require('../../src/core/DependencyContainer');

describe('DependencyContainer', () => {
  let container;

  beforeEach(() => {
    container = new DependencyContainer();
  });

  describe('registerSingleton', () => {
    test('should register singleton service', () => {
      const service = { name: 'test' };
      container.registerSingleton('testService', service);

      expect(container.has('testService')).toBe(true);
      expect(container.get('testService')).toBe(service);
    });

    test('should warn on duplicate registration', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      container.registerSingleton('test', {});
      container.registerSingleton('test', {});

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should always return same instance', () => {
      const service = { count: 0 };
      container.registerSingleton('counter', service);

      const instance1 = container.get('counter');
      const instance2 = container.get('counter');

      expect(instance1).toBe(instance2);
    });
  });

  describe('registerFactory', () => {
    test('should register factory function', () => {
      const factory = () => ({ created: true });
      container.registerFactory('testFactory', factory);

      expect(container.has('testFactory')).toBe(true);
    });

    test('should create instance on first get', () => {
      const factory = jest.fn(() => ({ created: true }));
      container.registerFactory('testFactory', factory);

      expect(factory).not.toHaveBeenCalled();

      const instance = container.get('testFactory');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(instance.created).toBe(true);
    });

    test('should pass container to factory', () => {
      const factory = jest.fn((cont) => {
        expect(cont).toBe(container);
        return {};
      });

      container.registerFactory('testFactory', factory);
      container.get('testFactory');

      expect(factory).toHaveBeenCalledWith(container);
    });

    test('should cache factory result', () => {
      const factory = jest.fn(() => ({ created: true }));
      container.registerFactory('testFactory', factory);

      container.get('testFactory');
      container.get('testFactory');

      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    test('should throw error for unregistered service', () => {
      expect(() => container.get('nonexistent')).toThrow();
    });

    test('should retrieve registered singleton', () => {
      const service = { name: 'test' };
      container.registerSingleton('test', service);

      expect(container.get('test')).toBe(service);
    });

    test('should create and cache factory result', () => {
      container.registerFactory('test', () => ({ value: 42 }));

      const first = container.get('test');
      const second = container.get('test');

      expect(first).toBe(second);
      expect(first.value).toBe(42);
    });
  });

  describe('has', () => {
    test('should return true for registered service', () => {
      container.registerSingleton('test', {});
      expect(container.has('test')).toBe(true);
    });

    test('should return true for registered factory', () => {
      container.registerFactory('test', () => ({}));
      expect(container.has('test')).toBe(true);
    });

    test('should return false for unregistered service', () => {
      expect(container.has('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    test('should clear all services', () => {
      container.registerSingleton('test1', {});
      container.registerFactory('test2', () => ({}));

      container.clear();

      expect(container.has('test1')).toBe(false);
      expect(container.has('test2')).toBe(false);
    });
  });

  describe('listServices', () => {
    test('should list all registered services', () => {
      container.registerSingleton('service1', {});
      container.registerFactory('service2', () => ({}));
      container.registerSingleton('service3', {});

      const list = container.listServices();

      expect(list).toContain('service1');
      expect(list).toContain('service2');
      expect(list).toContain('service3');
      expect(list.length).toBe(3);
    });

    test('should return sorted list', () => {
      container.registerSingleton('zebra', {});
      container.registerSingleton('apple', {});
      container.registerSingleton('banana', {});

      const list = container.listServices();

      expect(list).toEqual(['apple', 'banana', 'zebra']);
    });

    test('should return empty array for no services', () => {
      const list = container.listServices();
      expect(list).toEqual([]);
    });
  });
});
