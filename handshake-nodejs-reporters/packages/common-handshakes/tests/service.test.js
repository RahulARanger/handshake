const {
  describe, test, expect, beforeAll, afterAll,
} = require('@jest/globals');
const { existsSync, rmSync } = require('fs');
const { join } = require('path');
const { ServiceDialPad } = require('../dist/index');
const {
  root, resetDir, results, reports,
} = require('./utils');

describe('Verifying the handshake-server helper class', () => {
  beforeAll(() => resetDir);

  describe('Verifying the closed server end to end', () => {
    const instance = new ServiceDialPad(6962, 'debug');

    test('instance configuration', () => {
      expect(instance.exePath).toBe(ServiceDialPad.defaultExe);
      expect(instance.port).toBe(6962);
    });

    test('verifying the closed ping', async () => {
      expect(await instance.ping()).toBe(false);
    }, 100e3);

    test('verifying the closed server status', async () => {
      expect(await instance.isServerTerminated()).toBe(true);
    });

    test('verifying the termination of closed server', async () => {
      expect(await instance.terminateServer()).toBe(undefined);
    });
  });

  describe('verifying the running service', () => {
    const instance = new ServiceDialPad(7272, 'debug');

    afterAll(async () => {
      await instance.terminateServer();
    });

    test('verifying the initialization of the server', async () => {
      const server = instance.startService('common-handshakes-jest-tests', results, root);
      expect(await instance.ping()).toBe(false); // instance takes some time to start
      await instance.waitUntilItsReady(); // so we need to wait

      expect(await instance.ping()).toBe(true); // now it should be running at the port: 7272
      expect(server).not.toBe(undefined);

      expect(existsSync(results)).toBe(true);
      expect(existsSync(join(results, 'TeStReSuLtS.db'))).toBe(true);
    }, 20e3);

    test('verifying the ping for the valid server', async () => {
      expect(await instance.ping()).toBe(true);
    });

    test('verifying the update run config with valid payload', async () => {
      const resp = await instance.updateRunConfig({
        maxInstances: 2,
        avoidParentSuitesInCount: false,
        framework: 'jest-tests',
        exitCode: 0,
        fileRetries: 1,
        tags: [{ name: '@test', label: 'test tag' }, { name: '*.spec.js', label: 'spec tag' }],
        platformName: 'windows',
      });
      expect(resp).not.toBeUndefined();
      expect(resp?.status).toBe(200);
    });

    test('verifying the update run config with invalid payload', async () => {
      const resp = await instance.updateRunConfig({ maxInstances: 2 });
      await expect(resp).toBeUndefined();
    });

    test('Verifying the isTerminated flag', async () => {
      expect(await instance.isServerTerminated()).toBe(false);
    });

    test('Verifying the termination of the server', async () => {
      await instance.terminateServer();

      // there is ~1.5 seconds delay for the server termination
      // reason: db connection and server termination (multiple process)
      // takes time for its termination

      await new Promise((resolve) => { setTimeout(resolve, 3e3); });
      // on max we can set 3 seconds for termination

      expect(await instance.isServerTerminated()).toBe(true);
    }, 20e3);

    test('verifying the export generation but cancelled due to timeout error', async () => {
      try {
        await instance.generateReport(results, root, reports, 6e2);
        expect(false).toBe(true);
      } catch (err) {
        instance.logger.warn(err);
        expect(err.type).not.toBe('JestAssertionError');
        expect(err.message?.includes('ETIMEDOUT')).toBe(true);
      }
    });
    test('verifying the export generation', async () => {
      if (existsSync(reports)) rmSync(reports, { recursive: true, force: true });
      expect(existsSync(reports)).toBe(false);
      await instance.generateReport(results, root, reports);
      expect(existsSync(reports)).toBe(true);
      expect(existsSync(join(reports, 'RUNS', 'index.html'))).toBe(true);
      expect(existsSync(join(reports, 'Import'))).toBe(true);
    });
  });

  describe('verifying the disabled service', () => {
    const instance = new ServiceDialPad(7272, 'info', true);

    afterAll(async () => {
      await instance.terminateServer();
    });

    test('verifying the initialization of the server', async () => {
      const server = instance.startService('common-handshakes-jest-tests', results, root);
      expect(await instance.ping()).toBe(true); // instance takes some time to start
      await instance.waitUntilItsReady(); // so we need to wait
      expect(server).toBe(undefined);
    }, 20e3);

    test('verifying the update run config with valid payload', async () => {
      const resp = await instance.updateRunConfig({
        maxInstances: 2,
        avoidParentSuitesInCount: false,
        framework: 'jest-tests',
        exitCode: 0,
        fileRetries: 1,
        platformName: 'windows',
        tags: ['@test', '*.spec.js'],
      });
      expect(resp).toBeUndefined();
    });

    test('Verifying the isTerminated flag', async () => {
      expect(await instance.isServerTerminated()).toBe(true);
    });

    test('Verifying the termination of the server', async () => {
      await instance.terminateServer();
      expect(await instance.isServerTerminated()).toBe(true);
    }, 20e3);

    test('Verifying the skipped export', async () => {
      await instance.generateReport(results, root, reports);
    });
  });
});
