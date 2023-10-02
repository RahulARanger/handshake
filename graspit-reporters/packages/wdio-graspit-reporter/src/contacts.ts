// eslint-disable-next-line max-classes-per-file
import WDIOReporter from '@wdio/reporter';
import log4js, { Logger } from 'log4js';
import type { ReporterOptions, GraspItServiceOptions } from './types';

// eslint-disable-next-line import/no-mutable-exports
export let port: undefined | number;

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
    port = options.port;
  }

  static get url(): string {
    return `http://127.0.0.1:${port}`;
  }

  static get toSaveUrl(): string {
    return `${this.url}/save`;
  }

  // eslint-disable-next-line class-methods-use-this
  get saveUrl(): string {
    return ReporterContacts.toSaveUrl;
  }

  get addFeatureUrl(): string {
    return `${this.saveUrl}/addFeature`;
  }

  get addSuiteUrl(): string {
    return `${this.saveUrl}/addSuite`;
  }

  get registerSession(): string {
    return `${this.saveUrl}/registerSession`;
  }

  get registerSuite(): string {
    return `${this.saveUrl}/registerSuite`;
  }

  get updateSuite(): string {
    return `${this.saveUrl}/updateSuite`;
  }

  get updateSession(): string {
    return `${this.saveUrl}/updateSession`;
  }

  static get addAttachmentForEntity(): string {
    return `${this.toSaveUrl}/addAttachmentForEntity`;
  }
}

export class ContactsForService {
  options: GraspItServiceOptions = {};

  logger: Logger;

  constructor(options: GraspItServiceOptions) {
    this.logger = log4js.getLogger('wdio-py-service');
    this.logger.level = 'debug';
    this.options = options;
  }

  get url(): string {
    return `http://127.0.0.1:${this.options.port}`;
  }

  get updateRunConfig(): string {
    return `${this.url}/save/currentRun`;
  }
}
