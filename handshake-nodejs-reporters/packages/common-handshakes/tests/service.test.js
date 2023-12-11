const {
  describe, test, expect, it,
} = require('@jest/globals');

const { join, dirname } = require('path');
const { ServiceDialPad } = require('../src');

describe('Verifying the closed server end to end', () => {
  const instance = new ServiceDialPad(6969);

  test('instance configuration', () => {
    expect(instance.exePath).toBe(ServiceDialPad.defaultExe);
    expect(instance.port).toBe(6969);
  });

  test('verifying the function for executing synchronous command', () => {
    const result = instance.executeCommand(['--help'], true, process.cwd());
    expect(result).not.toBeUndefined(); // there should be process returned
    expect(result.error).toBeUndefined(); // no errors
    expect(result.status).toBe(0); // 0 exit code
  });

  test('verifying the closed ping', async () => {
    expect(await instance.ping()).toBe(false);
  });

  test('verifying the closed server status', async () => {
    expect(await instance.isServerTerminated()).toBe(true);
  });

  test('verifying the termination of closed server', async () => {
    expect(await instance.terminateServer()).toBe(undefined);
  });
});

describe('verifying the running service', () => {
  const instance = new ServiceDialPad(6969);
  const root = dirname(dirname(process.cwd()));
  const results = join(root, 'Jest-Results');

  it('verifying the initialization of the server', async () => {
    const server = await instance.startService('common-handshakes-jest-tests', results, root);
    expect(await instance.ping()).toBe(false);
    await instance.waitUntilItsReady();
    expect(await instance.ping()).toBe(true);
    expect(server).not.toBe(undefined);
  }, 10e3);

  it('verifying the ping for the valid server', async () => {
    expect(await instance.ping()).toBe(true);
  });

  it('Verifying the isTerminated flag', async () => {
    expect(await instance.isServerTerminated()).toBe(false);
  });

  it('Verifying the termination of the server', async () => {
    await instance.terminateServer();
    expect(await instance.isServerTerminated()).toBe(true);
  });
});
