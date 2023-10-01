// eslint-disable-next-line max-classes-per-file
import WDIOReporter from '@wdio/reporter';
import log4js, { Logger } from 'log4js';
import type { ReporterOptions, GraspItServiceOptions } from './types';

// eslint-disable-next-line import/no-mutable-exports
export let port: undefined | number;

export default class ReporterContacts extends WDIOReporter {
  options: ReporterOptions = {};

  logger: Logger;

  constructor(options: ReporterOptions) {
    super(options);
    this.options = options;
    this.logger = log4js.getLogger('wdio-py-reporter');
    port = options.port;
  }

  get url(): string {
    return `http://127.0.0.1:${this.options.port}`;
  }

  get saveUrl(): string {
    return `${this.url}/save`;
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
}

export class ContactsForService {
  options: GraspItServiceOptions = {};

  get url(): string {
    return `http://127.0.0.1:${this.options.port}`;
  }

  get updateRunConfig(): string {
    return `${this.url}/save/currentRun`;
  }
}
