import type {
  AfterCommandArgs,
  RunnerStats, SuiteStats, TestStats,
} from '@wdio/reporter';
import {
  Assertion,
  MarkTestEntity, MarkTestSession, RegisterTestEntity, Standing, SuiteType, sanitizePaths,
} from 'common-handshakes';
import ReporterContacts from './contacts';
import { isScreenShot } from './helpers';

export default class HandshakeReporter extends ReporterContacts {
  expectedIndex(snapshotIndex: number, requestFromEnd: number) {
    // assumed requestFromEnd < 0
    return -(this.currentSuites.length - snapshotIndex) + requestFromEnd;
  }

  fetchParent(suiteOrTest: SuiteStats | TestStats, snapshot: number): string {
    const expectedParent = suiteOrTest.parent ?? '';
    const fetchedParent = this.supporter.idMapped[
      (this.suites[expectedParent] as SuiteStats | undefined)?.uid ?? ''
    ] as string | undefined;

    return (
      fetchedParent
      || this.supporter.idMapped[
        this.currentSuites.at(
          this.expectedIndex(snapshot, suiteOrTest.uid.includes('suite') ? -2 : -1),
        )?.uid ?? ''
      ]
      || ''
    );
  }

  extractRegistrationPayloadForTestEntity(
    suiteOrTest: SuiteStats | TestStats,
    type: SuiteType,
    snapshot: number,
  ): RegisterTestEntity {
    const {
      title, file, tags, description,
    } = suiteOrTest as SuiteStats;
    const started = suiteOrTest.start.toISOString();

    const payload = {
      title,
      description: description ?? '',
      file: sanitizePaths([file || this.currentSuites.at(this.expectedIndex(snapshot, -1))?.file || '']).at(0) ?? '',
      tags: tags?.map((tag, index) => ({ name: typeof tag === 'string' ? tag : tag.name, astNodeId: String(index) })) || [],
      started,
      suiteType: type,
      parent: this.fetchParent(suiteOrTest, snapshot),
      session_id: this.supporter.idMapped.session ?? '',
      retried: this.runnerStat?.retry ?? 0,
    };
    return payload;
  }

  // eslint-disable-next-line class-methods-use-this
  extractRequiredForEntityCompletion(
    suiteOrTest: SuiteStats | TestStats,
  ): MarkTestEntity {
    const { duration } = suiteOrTest;
    const { errors, error, state: entityState } = suiteOrTest as TestStats;
    const state = entityState as undefined | string;

    const ended = suiteOrTest.end
      ? suiteOrTest.end.toISOString()
      : new Date().toISOString();

    const standing = (
      (suiteOrTest.type === 'test' ? state : 'YET_TO_CALC') || 'PENDING'
    ).toUpperCase() as Standing;

    const ifNotErrors = !errors?.length && error ? [error] : [];

    const payload = {
      duration,
      suiteID: this.supporter.idMapped[suiteOrTest.uid],
      ended,
      standing,
      errors: errors?.length ? errors : ifNotErrors,
    };

    return payload;
  }

  onRunnerStart(runnerStats: RunnerStats): void {
    if (!runnerStats.sessionId) {
      this.skipTestRun = true;
      this.logger.warn("😐 Skipping this test run, as we didn't get the session ID.");
      return;
    }

    this.supporter.requestRegisterSession(
      {
        started: this.runnerStat?.start ?? new Date(),
        specs: sanitizePaths(runnerStats.specs),
        retried: this.runnerStat?.retry ?? 0,
      },
    );
  }

  onSuiteStart(suite: SuiteStats): void {
    if (this.skipTestRun) {
      return;
    }
    this.supporter.requestRegisterTestEntity(
      suite.uid,
      () => this.extractRegistrationPayloadForTestEntity(suite, 'SUITE', this.currentSuites.length),
    );
  }

  addTest(test: TestStats, note?:number): void {
    if (this.skipTestRun) {
      return;
    }
    this.supporter.requestRegisterTestEntity(
      test.uid,
      () => this.extractRegistrationPayloadForTestEntity(test, 'TEST', note ?? this.currentSuites.length),
    );
  }

  onSuiteEnd(suite: SuiteStats): void {
    if (this.skipTestRun) {
      return;
    }
    this.supporter.markTestEntity(() => this.extractRequiredForEntityCompletion(suite));
  }

  onTestStart(test: TestStats): void {
    this.addTest(test);
  }

  markTestCompletion(test: TestStats): void {
    if (this.skipTestRun) {
      return;
    }
    this.supporter.markTestEntity(() => this.extractRequiredForEntityCompletion(test));
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

    this.supporter.pipeQueue.add(() => {
      if (this.supporter.idMapped[test.uid]) { return this.markTestCompletion(test); }
      this.addTest(test, note);
      return this.markTestCompletion(test);
    });
  }

  onRunnerEnd(runnerStats: RunnerStats): void {
    if (this.skipTestRun) {
      return;
    }

    const caps = this.runnerStat
      ?.capabilities as WebdriverIO.Capabilities;
    const payload: MarkTestSession = {
      ended: runnerStats.end?.toISOString() ?? new Date().toISOString(),
      duration: runnerStats.duration,
      sessionID: this.supporter.idMapped.session ?? '',
      passed: this.counts.passes,
      failed: this.counts.failures,
      skipped: this.counts.skipping,
      hooks: this.counts.hooks,
      tests: this.counts.tests,
      entityName: caps.browserName ?? 'no-name-found',
      entityVersion: caps.browserVersion ?? '0.0.1',
      simplified: runnerStats.sanitizedCapabilities,
    };
    this.supporter.markTestSession(() => payload);
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
        this.supporter.idMapped[attachedTest.uid],
        attachedTest.fullTitle,
      );
    }
  }

  async onAfterAssertion(assertionArgs: Assertion) {
    await this.supporter.addAssertion(assertionArgs, this.currentTestID);
  }

  get isSynchronised(): boolean {
    return this.supporter.pipeQueue.size === 0;
  }
}
