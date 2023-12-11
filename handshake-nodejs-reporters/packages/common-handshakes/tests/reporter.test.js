const { describe, test, expect } = require('@jest/globals');
const { ServiceDialPad, ReporterDialPad } = require('../src');

describe('Verifying the service end to end', () => {
  const instance = new ServiceDialPad(6969);

  test('instance configuration', () => {
    expect(instance.exePath).toBe(ServiceDialPad.defaultExe);
  });
});
