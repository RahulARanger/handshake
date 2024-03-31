const {
  describe, test, expect,
} = require('@jest/globals');
const { attachReporter } = require('../dist/index');

describe('should attach configuration to reporter and service from the common options', () => {
  test('should have reporters and services and port of 6969', () => {
    const config = { reporters: [], services: [] };
    attachReporter(config, {});
    expect(config.reporters).toHaveLength(1);
    expect(config.services).toHaveLength(1);
    expect(config.reporters.at(0).at(-1).port).toBe(6969);
    expect(config.services.at(0).at(-1).port).toBe(6969);
  });
  test('should not impact existing reporters and services', () => {
    const config = { reporters: [{}], services: [{}] };
    attachReporter(config, {});
    expect(config.reporters).toHaveLength(2);
    expect(config.services).toHaveLength(2);
    expect(config.reporters[0]).toEqual({});
    expect(config.services[0]).toEqual({});
  });

  test('should pick the log level from the config if not provided', () => {
    const config = { reporters: [], services: [], logLevel: 'error' };
    attachReporter(config, {});
    expect(config.reporters[0].at(-1).logLevel).toEqual('error');
    expect(config.services[0].at(-1).logLevel).toEqual('error');
  });
});

describe('should add or modify values based on the values provided', () => {
  test('should set avoidParentSuitesInCount as true for cucumber framework', () => {
    const config = { reporters: [], services: [], framework: 'cucumber' };
    attachReporter(config, {});
    expect(config.services.at(0).at(-1).testConfig.avoidParentSuitesInCount).toBe(true);
  });
  test('should set avoidParentSuitesInCount as false for others', () => {
    const config = { reporters: [], services: [], framework: 'mocha' };
    attachReporter(config, {});
    expect(config.services.at(0).at(-1).testConfig.avoidParentSuitesInCount).toBe(false);
  });

  test('should timeout value for the reporter\'s queue of value at least a minute', () => {
    const config = { reporters: [], services: [], framework: 'mocha' };
    attachReporter(config, { timeout: 60e3 });
    expect(config.reporters.at(0).at(-1).timeout).toBe(60e3);
    expect(config.services.at(0).at(-1).timeout).toBe(120e3);
  });

  test('should timeout value for the service\'s queue of value at least two minutes', () => {
    const config = { reporters: [], services: [], framework: 'mocha' };
    attachReporter(config, { timeout: 50e3 });
    expect(config.reporters.at(0).at(-1).timeout).toBe(60e3);
    expect(config.services.at(0).at(-1).timeout).toBe(120e3);
  });
});
