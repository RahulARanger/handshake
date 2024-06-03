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
import { frameworksUsedString, ReporterDialPad, ServiceDialPad } from 'common-handshakes';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Level } from 'pino';
import HandshakeJestReporterOptions from './types';

export default class HandshakeJestReporter implements Reporter {
  globalConfig: Config.GlobalConfig;

  serviceSupport: ServiceDialPad;

  reporterSupport: ReporterDialPad;

  options: HandshakeJestReporterOptions;

  rootDir: string;

  resultsDir: string;

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

  onRunStart(
    aggregatedResults: AggregatedResult,
    options: ReporterOnStartOptions,
  ): void {
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
  }

  log(message: string): void {
    console.log(`log arguments: ${message}`);
  }

  async onTestFileStart(test: Test): Promise<void> {
    await this.serviceSupport.waitUntilItsReady();

    this.reporterSupport.registerTestSession(
      {
        started: new Date(),
        retried: 0,
      },
    );
  }

  async onTestStart(test: Test): Promise<void> {
    console.log(test);
  }

  async onTestCaseResult(test: Test, testCaseResult: TestCaseResult): Promise<void> {
    console.log(test, testCaseResult);
  }

  async onTestFileResult(
    test: Test,
    testResult: TestResult,
    aggregatedResult: AggregatedResult,
  ): Promise<void> {
    console.log(test, testResult, aggregatedResult);
  }

  async onTestResult(
    test: Test,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ): Promise<void> {
    console.log('onTestResult arguments');
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
    this.flagToPyThatsItsDone();
  }

  // getLastError(): Error | undefined {
  //   return this._error;
  // }
}
