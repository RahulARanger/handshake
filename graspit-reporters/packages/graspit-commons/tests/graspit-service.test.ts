import {
  describe, expect, beforeAll, test,
} from '@jest/globals';
import { type ChildProcess } from 'node:child_process';
import { ServiceDialPad } from '../src';
import { setTimeout } from 'node:timers/promises';

describe('verifying if we are able to start graspit server', () => {
  const port = 6969;
  const service = new ServiceDialPad(port);
  const testResults = './jest-init-tests';
  let pyProcess: ChildProcess;

  beforeAll(() => {
    pyProcess = service.startService(
      'jest-test',
      testResults,
      process.cwd(),
      port,
    );
  });

  test('test the save url', () => {
    expect(service.saveUrl).toEqual(`http://127.0.0.1:${port}/save`);
  });

  test('test the start service', () => {
    expect(typeof pyProcess.pid).toBe('number');
  });

  test('test wait until the server is started', async () => {
    expect(await service.ping()).toBeTruthy();
  });

  // test('test termination of the server', async () => {
  //   expect(await service.isServerTerminated()).toBeFalsy();
  //   try {
  //     await service.terminateServer();
  //   } catch (err) {
  //     console.warn(err);
  //   }
  // });
});
