// eslint-disable-next-line max-classes-per-file
import WDIOReporter, { TestStats } from '@wdio/reporter';
import log4js, { Logger } from 'log4js';
import { ReporterDialPad, ServiceDialPad } from 'common-handshakes';
import { join } from 'node:path';
import type { ReporterOptions, HandshakeServiceOptions } from './types';

// eslint-disable-next-line import/no-mutable-exports
export let currentReporter: undefined | ReporterContacts;

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } },
});

export default class ReporterContacts extends WDIOReporter {
  options: ReporterOptions;

  skipTestRun: boolean = false;

  supporter: ReporterDialPad;

  logger: Logger;

  constructor(options: ReporterOptions) {
    super(options);
    this.options = options;

    this.logger = log4js.getLogger('wdio-py-reporter');
    this.logger.level = this.options.logLevel ?? 'debug';

    this.supporter = new ReporterDialPad(
      this.options.port,
      this.resultsDir,
      this.options.timeout,
      this.options.logLevel,
    );
    currentReporter = this;
  }

  get currentTest(): undefined | TestStats {
    return this.currentSuites.at(-1)?.tests?.at(-1);
  }

  get currentTestID(): string {
    return this.supporter.idMapped[this.currentTest?.uid ?? ''];
  }

  get currentSuiteID(): string {
    const suites = this.currentSuites.map((suite) => suite.uid).reverse();
    return this.supporter.idMapped[
      suites.find((suite) => this.supporter.idMapped[suite]) ?? ''
    ];
  }

  get resultsDir(): string {
    return join(
      this.options.root ?? process.cwd(),
      this.options.collectionName ?? 'Test Results',
    );
  }

  currentEntity(for_suite?: boolean): string {
    if (!for_suite) return this.currentTestID ?? '';
    return this.currentSuiteID ?? '';
  }
}

export class ContactsForService {
  logger: Logger;

  supporter: ServiceDialPad;

  options: HandshakeServiceOptions;

  constructor(options: HandshakeServiceOptions) {
    this.logger = log4js.getLogger('wdio-py-service');
    this.options = options;
    this.logger.level = this.options.logLevel ?? 'debug';
    this.supporter = new ServiceDialPad(
      this.options.port,
      this.options.logLevel,
      this.options.exePath,
    );
  }

  get resultsDir(): string {
    return join(
      this.options.root ?? process.cwd(),
      this.options.collectionName ?? 'Test Results',
    );
  }
}
