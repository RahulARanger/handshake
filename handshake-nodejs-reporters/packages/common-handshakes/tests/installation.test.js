const { describe, test, expect } = require('@jest/globals');
const { dirname, join } = require('path');
const { platform } = require('process');
const { existsSync } = require('fs');
const { getPath, getBinPath, getVersionFromNames } = require('../installation/get_path.cjs');

describe('Verifying the Installation of common-handshakes', () => {
  test('verifying the paths returned', () => {
    expect(getBinPath()).toBe(join(dirname(__dirname), 'bin'));
    expect(getPath()[1]).toContain('handshake');

    if (platform !== 'win32') expect(getPath()).not.toContain('exe');
  });

  test('Verifying the build installation', () => {
    expect(existsSync(join(getBinPath(), getPath()[1]))).toBe(true);
  });

  test('verifying the names from versions', async () => {
    expect(Object.keys(getVersionFromNames())).toHaveLength(3);
  });
});
