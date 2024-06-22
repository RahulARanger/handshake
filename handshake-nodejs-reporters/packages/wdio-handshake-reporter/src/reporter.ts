import type {
  AfterCommandArgs,
  RunnerStats, SuiteStats, TestStats,
} from '@wdio/reporter';
import {
  MarkTestEntity, MarkTestSession,
  RegisterTestEntity, Standing,
  SuiteType, acceptableDateString, sanitizePaths,
} from 'common-handshakes';
import ReporterContacts from './contacts';
import { isScreenShot } from './helpers';

export default class HandshakeReporter extends ReporterContacts {
  /**
   * gets the relative suite from the current suite id
   * @param snapshotIndex index of the current suite when observed previously in this.currentSuites
   * @param index from the current suite id fetch this index [optional, default: 0]
   * @returns
   */
  expectedIndex(snapshotIndex: number, index: number) {
    // assumed requestFromEnd < 0
    return -(this.currentSuites.length - snapshotIndex) + index;
  }

  fetchParent(suiteOrTest: SuiteStats | TestStats, snapshot: number): string {
    const expectedParent = suiteOrTest.parent ?? '';
    const fetchedParent = this.supporter.getFromMap(
      (this.suites[expectedParent] as SuiteStats | undefined)?.uid ?? '',
    );

    return (
      fetchedParent
      || this.supporter.getFromMap(
        this.currentSuites.at(
          this.expectedIndex(snapshot, suiteOrTest.uid.includes('suite') ? -2 : -1),
        )?.uid ?? '',
      )
      || ''
    );
  }

  /**
   * extracts the payload for registering a test entity [hook/test/suite]
   * @param suiteOrTest suite object or test object
   * @param type is it suite or test
   * @param snapshot at the time of its invocation (or adding the request)
   * what were the number of suites
   * @returns
   */
  extractRegistrationPayloadForTestEntity(
    suiteOrTest: SuiteStats | TestStats,
    type: SuiteType,
    snapshot: number,
  ): RegisterTestEntity {
    const {
      title, file, tags, description,
    } = suiteOrTest as SuiteStats;
    const payload = {
      title,
      description: description ?? '',
      file: sanitizePaths([file || this.currentSuites.at(this.expectedIndex(snapshot, -1))?.file || '']).at(0) ?? '',
      tags: tags?.map(
        (tag: any) => (typeof tag === 'string'
          ? { name: tag, label: 'tag' }
          : {
            name: tag.name,
            label: 'Feature file tag',
          }),
      )?.filter((tag) => tag) || [],
      started: acceptableDateString(suiteOrTest.start),
      suiteType: type,
      parent: this.fetchParent(suiteOrTest, snapshot),
      session_id: this.supporter.sessionId,
      retried: this.runnerStat?.retry ?? 0,
    };
    return payload;
  }

  // eslint-disable-next-line class-methods-use-this
  /**
   * extracts the payload from the test entity for updating its values.
   * @param suiteOrTest test entity to update
   * @returns
   */
  extractRequiredForEntityCompletion(
    suiteOrTest: SuiteStats | TestStats,
  ): MarkTestEntity {
    const { duration } = suiteOrTest;
    const { errors, error, state: entityState } = suiteOrTest as TestStats;
    const state = entityState as undefined | string;

    const ended = acceptableDateString(suiteOrTest.end
      ? suiteOrTest.end
      : new Date());

    const standing = (
      (suiteOrTest.type === 'test' ? state : 'YET_TO_CALC') || 'PENDING'
    ).toUpperCase() as Standing;

    const ifNotErrors = !errors?.length && error ? [error] : [];

    const payload = {
      duration,
      suiteID: this.supporter.getFromMap(suiteOrTest.uid) ?? '',
      ended,
      standing,
      errors: errors?.length ? errors : ifNotErrors,
    };

    return payload;
  }

  onRunnerStart(runnerStats: RunnerStats): void {
    if (!runnerStats.sessionId) {
      this.skipTestRun = true;
      this.logger.warn({ for: 'skipping tests', in: this.currentSpec ?? this.specs });
      return;
    }

    this.supporter.registerTestSession(
      {
        started: acceptableDateString(this.runnerStat?.start ?? new Date()),
        retried: this.runnerStat?.retry ?? 0,
      },
    );
  }

  onSuiteStart(suite: SuiteStats): void {
    if (this.skipTestRun) {
      return;
    }
    this.supporter.registerTestEntity(
      suite.uid,
      () => this.extractRegistrationPayloadForTestEntity(suite, 'SUITE', this.currentSuites.length),
    );
  }

  addTest(test: TestStats, note?:number): void {
    if (this.skipTestRun) {
      return;
    }
    this.supporter.registerTestEntity(
      test.uid,
      () => this.extractRegistrationPayloadForTestEntity(test, 'TEST', note ?? this.currentSuites.length),
    );
  }

  onSuiteEnd(suite: SuiteStats): void {
    if (this.skipTestRun) {
      return;
    }
    this.supporter.updateTestEntity(() => this.extractRequiredForEntityCompletion(suite));
  }

  onTestStart(test: TestStats): void {
    this.addTest(test);
  }

  markTestCompletion(test: TestStats): void {
    if (this.skipTestRun) {
      return;
    }
    this.supporter.updateTestEntity(() => this.extractRequiredForEntityCompletion(test));
  }

  onTestFail(test: TestStats): void {
    this.markTestCompletion(test);
  }

  onTestPass(test: TestStats): void {
    this.markTestCompletion(test);
  }

  onTestSkip(test: TestStats): void {
    // sometimes it was observed the skipped tests were not added
    // like the time when it is explicity skipped
    // so we register before marking it
    const note = this.currentSuites.length;

    this.supporter.addJob(() => {
      if (this.supporter.getFromMap(test.uid)) { return this.markTestCompletion(test); }
      this.addTest(test, note);
      return this.markTestCompletion(test);
    });
  }

  async onRunnerEnd(runnerStats: RunnerStats): Promise<void> {
    if (this.skipTestRun) {
      return;
    }

    const caps = this.runnerStat
      ?.capabilities as WebdriverIO.Capabilities;

    const payload: MarkTestSession = {
      ended: runnerStats.end?.toISOString() ?? new Date().toISOString(),
      duration: runnerStats.duration,
      sessionID: this.supporter.sessionId,
      passed: this.counts.passes,
      failed: this.counts.failures,
      skipped: this.counts.skipping,
      hooks: this.counts.hooks,
      tests: this.counts.tests,
      entityName: caps.browserName ?? 'no-name-found',
      entityVersion: caps.browserVersion ?? '0.0.1',
      simplified: runnerStats.sanitizedCapabilities,
    };
    this.supporter.updateTestSession(() => payload);

    await this.supporter.completeJobs();
  }

  async onAfterCommand(commandArgs: AfterCommandArgs): Promise<void> {
    if (this.skipTestRun) {
      return;
    }

    if (this.options.addScreenshots && isScreenShot(commandArgs)) {
      const attachedTest = this.currentTest;
      if (!attachedTest) return;

      await this.supporter.attachScreenshot(
        `Screenshot: ${attachedTest.title}`,
        commandArgs.result?.value ?? '',
        this.supporter.getFromMap(attachedTest.uid) ?? '',
        attachedTest.fullTitle,
      );
    }
  }

  async onAfterAssertion(
    assertionArgs: {
      matcherName: string, expectedValue: any,
      options: { wait: number, interval: number },
      result: { pass: boolean, message: () => string } },
  ) {
    await this.supporter.addAssertion(
      assertionArgs.matcherName,
      {
        expected: assertionArgs.expectedValue,
        message: assertionArgs.result.message(),
        passed: assertionArgs.result.pass,
      },
      this.currentTestID,
    );
  }

  get isSynchronised(): boolean {
    return this.supporter.jobsForIdleState === 0;
  }
}
