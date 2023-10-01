import type { RunnerStats, SuiteStats, TestStats } from '@wdio/reporter';
import type { Capabilities } from '@wdio/types';
import AsyncLock from 'async-lock';
import superagent from 'superagent';
import type {
  PayloadForMarkingTestEntityCompletion,
  PayloadForRegisteringTestEntity,
  SuiteType,
} from './types';
import ReporterContacts from './contacts';
import sanitizePaths from './helpers';

export default class GraspItReporter extends ReporterContacts {
  lock = new AsyncLock({
    timeout: 60e3,
    maxExecutionTime: 60e3,
    maxPending: 1000,
  });

  idMapped: Record<string, string> & { session?: string } = {};

  feed(
    feedURL: string,
    feedJSON: object | null,
    keyToBeStored?: null | string,
    dynamicKeys?: () => object,
  ): void {
    this.lock.acquire(
      this.runnerStat?.config.framework ?? 'unknown-framework',
      async (done) => {
        if (
          keyToBeStored !== 'session' && this.idMapped.session === undefined
        ) {
          this.logger.warn(
            '💔 Did not find live session, would fail in the next iteration',
          );
        }

        const payload = feedJSON || (dynamicKeys ? dynamicKeys() : {});
        this.logger.info(
          `🚚 URL: ${feedURL} || 📃 payload: ${JSON.stringify(
            payload,
          )}`,
        );
        const resp = await superagent.put(feedURL)
          .send(JSON.stringify(payload))
          .on('error', (err) => { throw new Error(err); });

        done(
          resp.ok ? undefined : new Error(`Found this status: ${resp.status} with body: ${resp.body}`),
          resp.text,
        );
      },
      (er, _text) => {
        const text = String(_text);

        if (er) {
          this.logger.error(
            `💔 URL: ${feedURL}, FOOD: ${JSON.stringify(
              feedJSON,
            )} | Message: ${er.message} || Response: ${text}`,
          );
        } else if (keyToBeStored) {
          this.logger.info(
            `Found 🤠 Key : ${keyToBeStored} | ${text}`,
          );
          this.idMapped[keyToBeStored] = String(text);
        } else this.logger.info(`🗳️ - ${text}`);
      },
    );
  }

  fetchParent(suiteOrTest: SuiteStats | TestStats): string {
    const expectedParent = suiteOrTest.parent ?? '';
    const fetchedParent = this.idMapped[
      (this.suites[expectedParent] as SuiteStats | undefined)?.uid ?? ''
    ] as string | undefined;

    return (
      fetchedParent
      || this.idMapped[this.currentSuites.at(suiteOrTest.uid.includes('suite') ? -2 : -1)?.uid ?? '']
      || ''
    );
  }

  extractRegistrationPayloadForTestEntity(
    suiteOrTest: SuiteStats | TestStats,
    type: SuiteType,
  ): PayloadForRegisteringTestEntity {
    const {
      title, file, tags, description,
    } = suiteOrTest as SuiteStats;
    const testStats = suiteOrTest as TestStats;
    const state = testStats.state as string | undefined;

    const started = suiteOrTest.start.toISOString();

    const payload = {
      title,
      description: description ?? '',
      file: sanitizePaths([file || this.currentSuites.at(-1)?.file || '']).at(0) ?? '',
      standing: (state || 'YET_TO_CALC').toUpperCase(),
      tags: tags ?? [],
      started,
      suiteType: type,
      parent: this.fetchParent(suiteOrTest),
      session_id: this.idMapped.session ?? '',
      retried: this.runnerStat?.retry ?? 0,
    };
    return payload;
  }

  extractRequiredForEntityCompletion(
    suiteOrTest: SuiteStats | TestStats,
  ): PayloadForMarkingTestEntityCompletion {
    const { duration } = suiteOrTest;
    const { errors, error, state: entityState } = suiteOrTest as TestStats;
    const state = entityState as undefined | string;

    const ended = suiteOrTest.end
      ? suiteOrTest.end.toISOString()
      : new Date().toISOString();

    const standing: string = (
      (suiteOrTest.type === 'test' ? state : 'YET_TO_CALC') || 'PENDING'
    ).toUpperCase();

    const payload = {
      duration,
      suiteID: this.idMapped[suiteOrTest.uid],
      ended,
      standing,
      errors: errors ?? [],
      error,
    };

    return payload;
  }

  onRunnerStart(runnerStats: RunnerStats): void {
    const caps = this.runnerStat
      ?.capabilities as Capabilities.DesiredCapabilities;

    this.feed(
      this.registerSession,
      {
        started: runnerStats.start.toISOString(),
        browserName: caps.browserName,
        browserVersion: caps.browserVersion,
        specs: sanitizePaths(runnerStats.specs),
        simplified: runnerStats.sanitizedCapabilities,
        retried: runnerStats.retry,
      },
      'session',
    );
  }

  onSuiteStart(suite: SuiteStats): void {
    this.feed(this.registerSuite, null, suite.uid, () => this.extractRegistrationPayloadForTestEntity(suite, 'SUITE'));
  }

  addTest(test: TestStats): void {
    this.feed(this.registerSuite, null, test.uid, () => this.extractRegistrationPayloadForTestEntity(test, 'TEST'));
  }

  onSuiteEnd(suite: SuiteStats): void {
    this.feed(this.updateSuite, null, null, () => this.extractRequiredForEntityCompletion(suite));
  }

  onTestStart(test: TestStats): void {
    this.addTest(test);
  }

  markTestCompletion(test: TestStats): void {
    this.feed(this.updateSuite, null, null, () => this.extractRequiredForEntityCompletion(test));
  }

  onTestEnd(test: TestStats): void {
    this.markTestCompletion(test);
  }

  onTestPass(test: TestStats): void {
    this.markTestCompletion(test);
  }

  onTestSkip(test: TestStats): void {
    // skipped tests are not registered
    this.addTest(test);
    this.markTestCompletion(test);
  }

  onRunnerEnd(runnerStats: RunnerStats): void {
    const payload = {
      ended: runnerStats.end?.toISOString() ?? new Date().toISOString(),
      duration: runnerStats.duration,
      sessionID: this.idMapped.session ?? '',
      passed: this.counts.passes,
      failed: this.counts.failures,
      skipped: this.counts.skipping,
      hooks: this.counts.hooks,
      tests: this.counts.tests,
    };
    this.feed(this.updateSession, payload);
  }
}
