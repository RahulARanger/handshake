import {
  describe,
  expect,
  beforeAll,
  test,
  afterAll,
  jest,
} from '@jest/globals';
import { type ChildProcess } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ServiceDialPad } from '../src';

const port = 6969;
const root = dirname(dirname(dirname(process.cwd())));
const service = new ServiceDialPad(port);
describe('Asserting the scenario when the server was not started yet', () => {
  jest.setTimeout(3e3);

  it('ping now', async () => {
    await expect(await service.ping()).toBe(false);
  });

  it('expect for failure message when the server has not started yet.', async () => {
    // so when this throws error, you will go forward.
    await expect(async () => service.waitUntilItsReady(1e3)).rejects.toThrow('Not able to connect with graspit-server within');
  });
});

// HERE our aim is to test the common service and any helper functions provided
// we assume that if a valid request is sent to the graspit server
// it would do what it was supposed to
// (like saving to db or adding relevant task or calculate some info).

describe('verifying if we are able to start graspit server', () => {
  jest.setTimeout(10e3);
  const testResults = join(root, 'jest-init-tests');
  const results = join(root, 'test-jest-reports');
  let pyProcess: ChildProcess;

  // for terminating the server if things do downhill
  async function safeSide() {
    await service.terminateServer();
    if (existsSync(testResults)) {
      rmSync(testResults, {
        recursive: true,
        retryDelay: 200,
        maxRetries: 3,
      });
    }
    if (existsSync(results)) {
      rmSync(results, {
        recursive: true,
        retryDelay: 200,
        maxRetries: 3,
      });
    }
  }

  afterAll(safeSide);
  process.on('exit', safeSide);

  // starting the python service
  beforeAll(async () => {
    expect(service.exePath).not.toBeUndefined();

    pyProcess = service.startService('jest-test', testResults, root);
    expect(service.pyProcess).not.toBeUndefined();

    await service.waitUntilItsReady();
  });

  describe('Verifying the functionality of the service', () => {
    test('test the save url', () => {
      expect(service.saveUrl).toEqual(`http://127.0.0.1:${port}/save`);
    });

    test("assert the process's pid", () => {
      expect(typeof pyProcess.pid).toBe('number');
    });

    test('valid ping', async () => {
      await expect(await service.ping()).toBeTruthy();
    });

    test('testing the presence of the database', () => {
      expect(existsSync(testResults)).toBeTruthy();
      expect(
        existsSync(join(testResults, 'TeStReSuLtS.db')),
      ).toBeTruthy();
    });
  });
});
