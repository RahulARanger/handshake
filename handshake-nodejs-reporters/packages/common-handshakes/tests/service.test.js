const {
  describe, test, expect, beforeAll, afterAll,
} = require('@jest/globals');
const { ServiceDialPad } = require('../dist/index');
const { root, resetDir, results } = require('./utils');

describe('Verifying the handshake-server helper class', () => {
  beforeAll(() => resetDir);

  describe('Verifying the closed server end to end', () => {
    const instance = new ServiceDialPad(6969, "debug");

    test('instance configuration', () => {
      expect(instance.exePath).toBe(ServiceDialPad.defaultExe);
      expect(instance.port).toBe(6969);
    });

    test('verifying the function for executing synchronous command', (done) => {
      const result = instance.executeCommand('--help', true, process.cwd());
      expect(result).not.toBeUndefined(); // there should be process returned
      expect(result.error).toBeUndefined(); // no errors
      expect(result.status).toBe(0); // 0 exit code
      done();
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
    const instance = new ServiceDialPad(7272);

    afterAll(async () => {
      await instance.terminateServer();
    });

    test('verifying the initialization of the server', async () => {
      const server = instance.startService('common-handshakes-jest-tests', results, root);
      expect(await instance.ping()).toBe(false); // instance takes some time to start
      await instance.waitUntilItsReady(); // so we need to wait

      expect(await instance.ping()).toBe(true); // now it should be running at the port: 7272
      expect(server).not.toBe(undefined);
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
  });
});
