import {
  describe, expect, beforeAll, test, afterAll, jest,
} from '@jest/globals';
import { type ChildProcess } from 'node:child_process';
import {
  setTimeout,
  setInterval,
  clearTimeout,
  clearInterval,
} from 'node:timers';
import { existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ReporterDialPad, ServiceDialPad } from '../src';

// HERE our aim is to test the common service and any helper functions provided
// we assume that if a valid request is sent to the graspit server
// it would do what it was supposed to
// (like saving to db or adding relevant task or calculate some info).

describe('verifying if we are able to start graspit server', () => {
  jest.setTimeout(60e3);

  const port = 6969;
  const root = dirname(dirname(dirname(process.cwd())));
  const testResults = join(root, 'jest-init-tests');
  const results = join(root, 'test-jest-reports');

  const service = new ServiceDialPad(port, join(root, 'dist', 'graspit'));
  let pyProcess: ChildProcess;

  async function safeSide() {
    await service.terminateServer();
    if (existsSync(testResults)) {
      rmSync(testResults, { recursive: true, retryDelay: 200, maxRetries: 3 });
    }
    if (existsSync(results)) {
      rmSync(results, { recursive: true, retryDelay: 200, maxRetries: 3 });
    }
  }

  afterAll(safeSide);
  process.on('exit', safeSide);

  beforeAll(async () => {
    pyProcess = service.startService(
      'jest-test',
      testResults,
      root,
    );
    await service.waitUntilItsReady();
  }, 120e3);

  describe('Verifying the functionality of the service', () => {
    test('test the save url', () => {
      expect(service.saveUrl).toEqual(`http://127.0.0.1:${port}/save`);
    });

    test('test the start service', () => {
      expect(typeof pyProcess.pid).toBe('number');
    });

    test('test wait until the server is started', async () => {
      expect(await service.ping()).toBeTruthy();
    });
    test('testing the presence of the database', () => {
      expect(existsSync(testResults)).toBeTruthy();
      expect(existsSync(join(testResults, 'TeStReSuLtS.db'))).toBeTruthy();
    });
  });

  describe('Verifying the functionality of the reporter', () => {
    const reporter = new ReporterDialPad(port, 10e3);
    const testKey = 'dummy-test';

    async function waitForLock(key: string) {
      await new Promise((resolve, reject) => {
        let timer: NodeJS.Timeout;

        const bomb = setTimeout(() => {
          clearInterval(timer);
          reject(new Error('Failed to register session in time'));
        }, 10e3);

        timer = setInterval(async () => {
          const isOnline = reporter.idMapped[key]?.length > 0;
          if (isOnline) {
            clearTimeout(bomb);
            clearInterval(timer);
            resolve({});
          }
        }, 3e3);
      });
    }

    test('verifying the save url for the reporter', () => {
      expect(reporter.saveUrl).toBe(`http://127.0.0.1:${port}/save`);
    });

    test('verifying endpoint for registering session', async () => {
      expect(reporter.idMapped.session).toBeUndefined();
      reporter.requestRegisterSession({ retried: 0, started: new Date().toISOString(), specs: ['test.spec.ts'] });
      expect(reporter.idMapped.session).toBeUndefined();
      expect(reporter.lock.isBusy()).toBeTruthy();
      await waitForLock('session');

      expect(reporter.lock.isBusy()).toBeFalsy();
    });
    test('creating dummy test', async () => {
      expect(reporter.idMapped[testKey]).toBeUndefined();
      reporter.requestRegisterTestEntity(testKey, {
        title: 'sample-test',
        description: 'dummy-test',
        suiteType: 'TEST',
        parent: '',
        session_id: reporter.idMapped.session as string,
        file: 'test.spec.ts',
        started: new Date().toISOString(),
        retried: 0,
        tags: [],
      });

      await waitForLock(testKey);

      expect(reporter.idMapped[testKey]).not.toBeUndefined();
    });

    test.failing('test for acceptance of ISO string for date-time not UTC ones', async () => {
      const failedKey = `${testKey}-failed`;
      reporter.feed(reporter.registerSuite, {
        title: 'sample-test',
        description: 'dummy-test',
        suiteType: 'TEST',
        parent: '',
        retried: 0,
        started: new Date().toUTCString(),
        session_id: reporter.idMapped.session,
        file: 'test.spec.ts',
        standing: 'PENDING',
        tags: [],
      }, failedKey);
      await waitForLock(failedKey);
    });

    test('verifying additional Requests if no entity id was provided', async () => {
      expect(await reporter.addDescription('test-description', '')).toBe(false);
      expect(await reporter.attachScreenshot('test-attach', '', '', '')).toBe(false);
    });

    test('verifying additional Requests if entity id was provided', async () => {
      expect(await reporter.addDescription('test-description', reporter.idMapped[testKey])).toBe(true);
      const raw = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQW7H8AAAAwUlEQVR42mL8/9/v1n7mJ6yoaGhq...';
      const attachmentId = await reporter.attachScreenshot('test-attach', raw, reporter.idMapped[testKey], 'test-description');
      expect(typeof attachmentId).toBe('string');
      if (attachmentId) expect(existsSync(join(testResults, 'Attachments', `${attachmentId}.png`))).toBe(true);
    });
  });

  describe('verifying report generation', () => {
    it('test mark test completion', async () => {
      await service.markTestRunCompletion();
      // aim is to not observe if this request fails / passes
      // but to check if it doesn't fail due to server termination
      // because we are expecting server to be online even at this point
    });
    it('skipping the patch would also skip the report generation', () => {
      service.generateReport(testResults, root, results, false, 2, true);
      expect(existsSync(results)).toBe(false);
    });

    it('test patch only', () => {
      service.generateReport(testResults, root, undefined, false, 1);
      expect(existsSync(results)).toBe(false);
    });

    it('test report generation', () => {
      expect(existsSync(testResults)).toBe(true);
      service.generateReport(testResults, root, results, false, 1);
      expect(existsSync(results)).toBe(true);
    });
  });
});
