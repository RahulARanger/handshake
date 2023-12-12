const {
  describe, test, expect, beforeAll, afterAll,
} = require('@jest/globals');

const { ReporterDialPad, ServiceDialPad, acceptableDateString } = require('../src');
const {
  resetDir, results, root, uuidRegex,
} = require('./utils');

describe('Verifying the functionality of the handshake-reporter', () => {
  const service = new ServiceDialPad(6969);
  const reporter = new ReporterDialPad(6969, 12e3);

  beforeAll(async () => {
    resetDir();
    await service.startService('jest-report-tests', results, root);
    await service.waitUntilItsReady();
    expect(await service.ping()).toBe(true);
  }, 10e3);

  afterAll(async () => {
    await service.terminateServer();
  });

  test('Verifying the config set', () => {
    expect(reporter.port).toBe(6969);
    expect(reporter.exePath).toBe(ServiceDialPad.defaultExe);
    expect(reporter.url).toBe(service.url);
  });

  test('verifying the registration of session', async () => {
    expect(reporter.pipeQueue.size).toBe(0);
    const job = reporter.requestRegisterSession({ retried: 0, specs: ['test.js'], started: new Date() });
    await job;
    expect(reporter.pipeQueue.size).toBe(0);
    expect(reporter.idMapped.session).toMatch(uuidRegex);
    expect(reporter.misFire).toBe(0);
  });

  test('verifying the registration of suites', async () => {
    const jobs = Array(3).fill(true).map(
      (_, index) => reporter
        .requestRegisterTestEntity(
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
          .requestRegisterTestEntity(
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

  test('verifying the marking of tests', async () => {
    const jobs = [];
    Array(3).fill(true).forEach((_, suite) => {
      Array(3).fill(true).forEach(
        (__, index) => jobs.push(reporter
          .markTestEntity(
            `test-${suite}-${index}`,
            () => (
              {
                duration: 20e3,
                errors: [],
                ended: new Date().toISOString(),
                standing: 'PASSED',
                suiteID: reporter.idMapped[`suite-${suite}`],

              }
            ),
          )),
      );
    });

    await Promise.all(jobs);
    expect(reporter.misFire).toBe(0);
  });
});
