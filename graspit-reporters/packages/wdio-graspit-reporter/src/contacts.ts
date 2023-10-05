// eslint-disable-next-line max-classes-per-file
import WDIOReporter, { TestStats } from '@wdio/reporter';
import log4js, { Logger } from 'log4js';
import ReporterDialPad from 'graspit-commons';
import type { ReporterOptions, GraspItServiceOptions } from './types';

// eslint-disable-next-line import/no-mutable-exports
export let currentReporter: undefined | ReporterContacts;

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } },
});

export default class ReporterContacts extends WDIOReporter {
  options: ReporterOptions = {};

  logger: Logger;

  constructor(options: ReporterOptions) {
    super(options);
    this.options = options;

    this.logger = log4js.getLogger('wdio-py-reporter');
    this.logger.level = 'debug';

    expect(this.options.port).not.toBeUndefined();
    ReporterDialPad.port = this.options.port;
    currentReporter = this;
  }

  get currentTest(): undefined | TestStats {
    return this.currentSuites.at(-1)?.tests?.at(-1);
  }

  get currentTestID(): string {
    return ReporterDialPad.idMapped[this.currentTest?.uid ?? ''];
  }
}

export class ContactsForService {
  options: GraspItServiceOptions = {};

  logger: Logger;

  constructor(options: GraspItServiceOptions) {
    this.logger = log4js.getLogger('wdio-py-service');
    this.logger.level = 'debug';
    ReporterDialPad.port = options.port;
  }
}
