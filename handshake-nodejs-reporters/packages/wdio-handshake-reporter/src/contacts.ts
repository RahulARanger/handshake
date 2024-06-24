// eslint-disable-next-line max-classes-per-file
import WDIOReporter, { TestStats } from '@wdio/reporter';
import { ReporterDialPad, ServiceDialPad } from '@handshake/common-handshakes';
import { join } from 'node:path';
import pino, { Logger } from 'pino';
import type { ReporterOptions, HandshakeServiceOptions } from './types';

// eslint-disable-next-line import/no-mutable-exports
export let currentReporter: undefined | ReporterContacts;

export default class ReporterContacts extends WDIOReporter {
  options: ReporterOptions;

  skipTestRun: boolean = false;

  supporter: ReporterDialPad;

  logger: Logger;

  constructor(options: ReporterOptions) {
    super(options);
    this.options = options;

    this.logger = pino({ name: 'wdio-handshake-reporter', level: options.logLevel?.toLowerCase() ?? 'info' });

    this.supporter = new ReporterDialPad(
      this.options.port,
      this.options.requestsTimeout,
      this.options.logLevel,
    );
    currentReporter = this;
  }

  get currentTest(): undefined | TestStats {
    return this.currentSuites.at(-1)?.tests?.at(-1);
  }

  get currentTestID(): string {
    return this.supporter.getFromMap(this.currentTest?.uid ?? '') ?? '';
  }

  get currentSuiteID(): string {
    const suites = this.currentSuites.map((suite) => suite.uid).reverse();
    return this.supporter.getFromMap(
      suites.find((suite) => this.supporter.getFromMap(suite)) ?? '',
    ) ?? '';
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
    this.logger = pino({ name: 'wdio-handshake-service', level: options.logLevel?.toLowerCase() ?? 'info' });
    this.options = options;
    this.supporter = new ServiceDialPad(
      this.options.port,
      this.options.logLevel,
    );
  }

  get resultsDir(): string {
    return join(
      this.options.root ?? process.cwd(),
      this.options.resultsFolderName ?? 'Test Results',
    );
  }
}
