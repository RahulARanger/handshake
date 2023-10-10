import type {
  AfterCommandArgs,
  RunnerStats, SuiteStats, TestStats,
} from '@wdio/reporter';
import type { Capabilities } from '@wdio/types';
import type {
  PayloadForMarkingTestEntityCompletion,
  PayloadForRegisteringTestEntity,
  SuiteType,
} from './types';
import ReporterContacts from './contacts';
import sanitizePaths, { isScreenShot } from './helpers';

export default class GraspItReporter extends ReporterContacts {
  fetchParent(suiteOrTest: SuiteStats | TestStats): string {
    const expectedParent = suiteOrTest.parent ?? '';
    const fetchedParent = this.supporter.idMapped[
      (this.suites[expectedParent] as SuiteStats | undefined)?.uid ?? ''
    ] as string | undefined;

    return (
      fetchedParent
      || this.supporter.idMapped[this.currentSuites.at(suiteOrTest.uid.includes('suite') ? -2 : -1)?.uid ?? '']
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
      session_id: this.supporter.idMapped.session ?? '',
      retried: this.runnerStat?.retry ?? 0,
    };
    return payload;
  }

  // eslint-disable-next-line class-methods-use-this
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
      suiteID: this.supporter.idMapped[suiteOrTest.uid],
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

    this.supporter.feed(
      this.supporter.registerSession,
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
    this.supporter.feed(this.supporter.registerSuite, null, suite.uid, () => this.extractRegistrationPayloadForTestEntity(suite, 'SUITE'));
  }

  addTest(test: TestStats): void {
    this.supporter.feed(this.supporter.registerSuite, null, test.uid, () => this.extractRegistrationPayloadForTestEntity(test, 'TEST'));
  }

  onSuiteEnd(suite: SuiteStats): void {
    this.supporter.feed(
      this.supporter.updateSuite,
      null,
      null,
      () => this.extractRequiredForEntityCompletion(suite),
    );
  }

  onTestStart(test: TestStats): void {
    this.addTest(test);
  }

  markTestCompletion(test: TestStats): void {
    this.supporter.feed(
      this.supporter.updateSuite,
      null,
      null,
      () => this.extractRequiredForEntityCompletion(test),
    );
  }

  onTestFail(test: TestStats): void {
    this.markTestCompletion(test);
  }

  onTestPass(test: TestStats): void {
    this.markTestCompletion(test);
  }

  onTestSkip(test: TestStats): void {
    this.markTestCompletion(test);
  }

  onRunnerEnd(runnerStats: RunnerStats): void {
    const payload = {
      ended: runnerStats.end?.toISOString() ?? new Date().toISOString(),
      duration: runnerStats.duration,
      sessionID: this.supporter.idMapped.session ?? '',
      passed: this.counts.passes,
      failed: this.counts.failures,
      skipped: this.counts.skipping,
      hooks: this.counts.hooks,
      tests: this.counts.tests,
    };
    this.supporter.feed(this.supporter.updateSession, payload);
  }

  async onAfterCommand(commandArgs: AfterCommandArgs): Promise<void> {
    if (this.options.addScreenshots && isScreenShot(commandArgs)) {
      const attachedTest = this.currentTest;
      if (!attachedTest) return;

      await this.supporter.attachScreenshot(
        `Screenshot: ${attachedTest.title}`,
        commandArgs.result?.value ?? '',
        this.supporter.idMapped[attachedTest.uid],
        attachedTest.fullTitle,
      );
    }
  }
}
