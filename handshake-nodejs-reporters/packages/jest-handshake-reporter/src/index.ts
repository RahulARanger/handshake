/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import {
  AggregatedResult,
  Config,
  Reporter,
  ReporterOnStartOptions,
  Test,
  TestResult,
  TestContext,
  TestCaseResult,
} from '@jest/reporters';
import {
  frameworksUsedString, RegisterTestEntity, ReporterDialPad, ServiceDialPad,
  Standing,
  SuiteType,
} from 'common-handshakes';
import { existsSync, mkdirSync } from 'fs';
import {
  basename, dirname, join, relative,
} from 'path';
import { Level } from 'pino';
import HandshakeJestReporterOptions from './types';
import joinAncestorTitles, { joinConstant, testID } from './helper';

type LeafEntity = Map<string, string>;

export default class HandshakeJestReporter implements Reporter {
  globalConfig: Config.GlobalConfig;

  serviceSupport: ServiceDialPad;

  reporterSupport: ReporterDialPad;

  options: HandshakeJestReporterOptions;

  rootDir: string;

  resultsDir: string;

  private trackingEntities: Map<string, LeafEntity> = new Map();

  private trackParentStatus: Map<string, Set<string>> = new Map();

  constructor(globalConfig: Config.GlobalConfig, options?: any) {
    this.globalConfig = globalConfig;
    this.options = options;

    const port = this.options?.port ?? 6969;
    const logLevel: undefined | Level = this.options.logLevel ?? (
      this.globalConfig.verbose ? 'info' : undefined);
    this.reporterSupport = new ReporterDialPad(
      port,
      this.options.requestsTimeout ?? this.globalConfig.openHandlesTimeout,
      logLevel,
      this.options.disabled,
    );
    this.serviceSupport = new ServiceDialPad(
      port,
      logLevel,
      this.options.disabled,
    );

    this.rootDir = this.options.root ?? this.globalConfig.rootDir;
    this.resultsDir = join(this.rootDir, this.options.resultsFolderName);
  }

  async onRunStart(
    aggregatedResults: AggregatedResult,
    options: ReporterOnStartOptions,
  ) {
    const { resultsDir } = this;

    if (!existsSync(resultsDir)) {
      mkdirSync(resultsDir);
    }

    this.serviceSupport.startService(
      this.options.testConfig.projectName,
      resultsDir,
      this.rootDir,
      this.options.workers,
    );
    await this.serviceSupport.waitUntilItsReady();
  }

  log(message: string): void {
    console.log(`log arguments: ${message}`);
  }

  async onTestFileStart(test: Test): Promise<void> {
    this.trackingEntities.set(test.path, new Map());

    await this.reporterSupport.registerTestSession(
      {
        started: new Date(),
        retried: 0,
      },
    );
  }

  async onTestCaseStart(test: Test, testCaseStartInfo: { ancestorTitles: Array<string>; fullName: string; mode: void | 'skip' | 'only' | 'todo'; title: string; startedAt?: number | null; }) {
    const currentFile = this.trackingEntities.get(test.path) as LeafEntity;
    const started = new Date(testCaseStartInfo.startedAt ?? 0);
    let store = '';
    let callApi = false;
    const ancestors: string[] = [];

    for (let index = 0; index <= testCaseStartInfo.ancestorTitles.length; index += 1) {
      store += (store ? joinConstant : '') + testCaseStartInfo.ancestorTitles[index];
      ancestors.push(store);
      if (currentFile?.get(store)) {
        currentFile.get(store) as string;
      } else {
        callApi = true;
        break;
      }
    }
    const testIDText = testID(testCaseStartInfo.startedAt);
    this.trackParentStatus.get(store)?.add(testIDText);

    // reset the parent ids
    store = '';

    if (callApi) {
      await this.reporterSupport.registerParentHierarchy(() => testCaseStartInfo
        .ancestorTitles
        .map((suite) => {
          const parent = currentFile?.get(store) ?? '';
          store += (store ? joinConstant : '') + suite;
          ancestors.push(store);

          if (!this.trackParentStatus.has(store)) this.trackParentStatus.set(store, new Set());
          if (parent) this.trackParentStatus.get(parent)?.add(store);
          if (currentFile?.get(store)) return currentFile.get(store) as string;

          return {
            description: store,
            retried: 0,
            file: test.path,
            session_id: this.reporterSupport.idMapped.session ?? '',
            suiteType: 'SUITE',
            tags: [],
            parent,
            title: suite,
            started,
          } as RegisterTestEntity;
        }), (resp) => {
        const response: string[] = JSON.parse(resp);
        response.forEach((id, index) => currentFile.set(ancestors[index], id));
      });
    }

    await this.reporterSupport.registerTestEntity(
      testIDText,
      () => ({
        description: testCaseStartInfo.fullName,
        file: test.path,
        session_id: this.reporterSupport.idMapped.session ?? '',
        suiteType: 'TEST' as SuiteType,
        retried: 0,
        started,
        title: testCaseStartInfo.title,
        tags: [],
        parent: '',
      }),
    );
  }

  async onTestCaseResult(test: Test, testCaseResult: TestCaseResult): Promise<void> {
    // TODO: Explore the cases for status: "pending" "todo" "focused"
    console.log(test, testCaseResult);
  }

  async onTestFileResult(
    test: Test,
    testResult: TestResult,
    aggregatedResult: AggregatedResult,
  ): Promise<void> {
    console.log(test, testResult, aggregatedResult);

    await this.reporterSupport.completeJobs();
    // we clear the mappings after completion of the jobs
    this.trackingEntities.delete(test.path);
    this.trackParentStatus.clear();

    const skippedTests = aggregatedResult.numTotalTests
    - (aggregatedResult.numPassedTests + aggregatedResult.numFailedTests
       + aggregatedResult.numPendingTests + aggregatedResult.numTodoTests);

    await this.reporterSupport.updateTestSession(
      () => ({
        sessionID: this.reporterSupport.idMapped.session ?? '',
        duration: test.duration ?? 0,
        passed: aggregatedResult.numPassedTests,
        failed: aggregatedResult.numFailedTests,
        skipped: skippedTests,
        hooks: 0,
        entityName: 'node',
        entityVersion: process.versions.node,
        simplified: process.version,
        tests: aggregatedResult.numTotalTests,
        ended: new Date(testResult.perfStats.end),
      }),
    );
  }

  async flagToPyThatsItsDone() {
    // closing handshake server for now.
    await this.serviceSupport.terminateServer();
  }

  async onRunComplete(
    test?: Set<TestContext>,
    runResults?: AggregatedResult,
  ): Promise<void> {
    const tags = [{ name: 'jest', label: 'framework' }];
    await this.reporterSupport.completeJobs();

    await this.serviceSupport.updateRunConfig({
      maxInstances: this.globalConfig.maxWorkers,
      platformName: String(process.platform),
      framework: frameworksUsedString(['jest']),
      avoidParentSuitesInCount: false,
      fileRetries: 0,
      bail: this.globalConfig.bail,
      exitCode: runResults?.wasInterrupted ? 1 : 0,
      tags,
    });

    const completed = this.serviceSupport.pyProcess?.killed;
    if (completed) return;

    await this.serviceSupport.markTestRunCompletion();
    await this.flagToPyThatsItsDone();
  }

  // getLastError(): Error | undefined {
  //   return this._error;
  // }
}
