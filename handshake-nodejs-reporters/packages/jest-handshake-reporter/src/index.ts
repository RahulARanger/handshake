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
} from '@jest/reporters';
import HandshakeJestReporterOptions from './types';

export default class HandshakeJestReporter implements Reporter {
  globalConfig: Config.GlobalConfig;

  options: HandshakeJestReporterOptions;

  constructor(globalConfig: Config.GlobalConfig, options?: any) {
    this.globalConfig = globalConfig;
    this.options = options;
  }

  log(message: string): void {
    console.log(`log arguments: ${message}`);
  }

  onRunStart(
    aggregatedResults: AggregatedResult,
    options: ReporterOnStartOptions,
  ): void {
    console.log('onRunStart arguments');
  }

  onTestStart(test?: Test): void {
    console.log('onTestStart arguments');
  }

  onTestResult(
    test: Test,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ): void {
    console.log('onTestResult arguments');
  }

  onRunComplete(
    test?: Set<TestContext>,
    runResults?: AggregatedResult,
  ): Promise<void> | void {
    console.log('onRunComplete arguments');
  }

  // getLastError(): Error | undefined {
  //   return this._error;
  // }
}
