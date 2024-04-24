const {
  describe, test, expect, beforeAll, afterAll,
} = require('@jest/globals');
const { join, dirname } = require('path');
const { ReporterDialPad, ServiceDialPad, acceptableDateString } = require('../dist/index');
const {
  resetDir, results, root, uuidRegex,
} = require('./utils');

describe('Verifying the functionality of the handshake-reporter', () => {
  const service = new ServiceDialPad(6969, 'error');
  const reporter = new ReporterDialPad(6969, 12e3, 'error');

  beforeAll(async () => {
    resetDir();
    service.startService('jest-report-tests', results, root);
    await service.waitUntilItsReady();
    expect(await service.ping()).toBe(true);
  }, 20e3);

  afterAll(async () => {
    service.terminateServer();
  }, 30e3);

  test('Verifying the config set', () => {
    expect(reporter.port).toBe(6969);
    expect(reporter.exePath).toBe(ServiceDialPad.defaultExe);
    expect(reporter.url).toBe(service.url);
  });

  describe('verifying the registration endpoints', () => {
    test('verifying the registration of session', async () => {
      expect(reporter.pipeQueue.size).toBe(0);
      const job = reporter.registerTestSession({ retried: 0, specs: ['test.js'], started: new Date() });
      await job;
      expect(reporter.pipeQueue.size).toBe(0);
      expect(reporter.idMapped.session).toMatch(uuidRegex);
      expect(reporter.misFire).toBe(0);
    });

    test('verifying the registration of suites', async () => {
      const jobs = Array(3).fill(true).map(
        (_, index) => reporter
          .registerTestEntity(
            `suite-${index}`,
            () => (
              {
                description: 'sample-suite',
                title: `suite-${index}`,
                file: 'test.js',
                parent: '',
                started: acceptableDateString(new Date()),
                session_id: reporter.idMapped.session,
                retried: 0,
                suiteType: 'SUITE',
                tags: [],
              }
            ),
          ),
      );

      await Promise.all(jobs);
      expect(reporter.misFire).toBe(0);

      expect(reporter.idMapped['suite-0']).toMatch(uuidRegex);
      expect(reporter.idMapped['suite-1']).toMatch(uuidRegex);
      expect(reporter.idMapped['suite-2']).toMatch(uuidRegex);

      // all ids are different
      expect(Array.from(new Set([reporter.idMapped['suite-0'], reporter.idMapped['suite-1'], reporter.idMapped['suite-2']]))).toHaveLength(3);
    });

    test('Verifying the registration of tests', async () => {
      const jobs = [];
      Array(3).fill(true).forEach((_, suite) => {
        Array(3).fill(true).forEach(
          (__, index) => jobs.push(reporter
            .registerTestEntity(
              `test-${suite}-${index}`,
              () => (
                {
                  description: 'sample-suite',
                  title: `test-${suite}-${index}`,
                  file: 'test.js',
                  parent: reporter.idMapped[`suite-${suite}`],
                  started: acceptableDateString(new Date()),
                  session_id: reporter.idMapped.session,
                  retried: 0,
                  suiteType: 'TEST',
                  tags: [],
                }
              ),
            )),
        );
      });

      await Promise.all(jobs);
      expect(reporter.misFire).toBe(0);
    });
  });
  let added = 0;

  describe('Verifying the attachments', () => {
    test('Verifying the description attachment', async () => {
      await reporter.addDescription('Sample-description for test - 0 - 0', reporter.idMapped['test-0-0']);
      await reporter.addDescription('Sample-description for suite - 0', reporter.idMapped['suite-0']);
      added += 2;
    });

    test('Verifying the link attachment', async () => {
      await reporter.addLink('https://github.com/RahulARanger/handshake', 'repo', reporter.idMapped['test-0-0']);
      await reporter.addLink('https://github.com/RahulARanger', 'author', reporter.idMapped['suite-0']);
      added += 2;
    });

    test('verifying the assertion attachment', async () => {
      await reporter.addAssertion('toEqual', { expected: 2, passed: true, message: 'Passed' }, reporter.idMapped['test-0-1']);
      await reporter.addAssertion('toEqual', {
        expected: 2, passed: true, message: 'Passed', interval: 100, wait: 500,
      }, reporter.idMapped['suite-0']);

      added += 2;
    });

    test('verifying the png attachment', async () => {
      const raw = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQW7H8AAAAwUlEQVR42mL8/9/v1n7mJ6yoaGhq...';
      const testAttachment = await reporter.attachScreenshot('screenshot-0', raw, reporter.idMapped['test-0-1'], 'sample-description');
      const expectedTestID = dirname(testAttachment);
      // expect(existsSync(testAttachment)).toBe(true);
      // commented because the file has not saved yet (async-write)
      expect(dirname(dirname(testAttachment))).toBe(join(results, 'Attachments'));
      expect(reporter.misFire).toBe(0);

      const suiteAttachment = await reporter.attachScreenshot('screenshot-0', raw, reporter.idMapped['suite-0']);
      // expect(existsSync(suiteAttachment)).toBe(true);
      expect(dirname(dirname(suiteAttachment))).toBe(join(results, 'Attachments'));

      expect(expectedTestID).toBe(dirname(suiteAttachment));
      expect(reporter.misFire).toBe(0);
    });
  });

  describe('verifying the marking endpoints', () => {
    test('verifying the marking of tests', async () => {
      const jobs = [];
      const pick = reporter.idMapped['test-0-0'];
      Array(3).fill(true).forEach((_, suite) => {
        Array(3).fill(true).forEach(
          (__, index) => {
            expect(reporter.idMapped[`test-${suite}-${index}`]).toMatch(uuidRegex);
            jobs.push(reporter
              .updateTestEntity(
                () => ({
                  duration: 20e3,
                  errors: [],
                  ended: new Date().toISOString(),
                  standing: 'PASSED',
                  suiteID: reporter.idMapped[`test-${suite}-${index}`],

                }),
              ));
          },
        );
      });

      await Promise.all(jobs);
      expect(reporter.misFire).toBe(0);
      expect(reporter.idMapped['test-0-0']).toBe(pick);
    });

    test('verifying the marking of the suites', async () => {
      const jobs = Array(3).fill(true).map(
        (_, index) => reporter
          .updateTestEntity(
            () => (
              {
                duration: 20e3,
                errors: [],
                ended: new Date().toISOString(),
                standing: 'PASSED',
                suiteID: reporter.idMapped[`suite-${index}`],
              }
            ),
          ),
      );

      await Promise.all(jobs);
      expect(reporter.misFire).toBe(0);
    });

    test('verifying the marking of the session', async () => {
      expect(reporter.requests).toHaveLength(added);

      const job = reporter
        .updateTestSession(
          () => (
            {
              duration: 20e3,
              ended: new Date().toISOString(),
              entityName: 'jest-runner',
              entityVersion: '0.1.0',
              simplified: 'jest-runner.0.1.0',
              hooks: 0,
              passed: 9,
              failed: 0,
              skipped: 0,
              tests: 3,
              sessionID: reporter.idMapped.session ?? '',
              standing: 'FAILED',
            }
          ),
        );

      await job;
      expect(reporter.misFire).toBe(0);
    });
  });

  test('finally p-queue should be free', () => {
    expect(reporter.pipeQueue.size).toBe(0);
  });
});
