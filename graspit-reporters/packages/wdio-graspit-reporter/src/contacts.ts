// eslint-disable-next-line max-classes-per-file
import WDIOReporter, { TestStats } from '@wdio/reporter';
import log4js, { Logger } from 'log4js';
import superagent from 'superagent';
import type { ReporterOptions, GraspItServiceOptions } from './types';

// eslint-disable-next-line import/no-mutable-exports
export let port: undefined | number;

// eslint-disable-next-line import/no-mutable-exports
export let currentReporter: undefined | ReporterContacts;

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } },
});

export default class ReporterContacts extends WDIOReporter {
  options: ReporterOptions = {};

  idMapped: Record<string, string> & { session?: string } = {};

  logger: Logger;

  constructor(options: ReporterOptions) {
    super(options);
    this.options = options;
    this.logger = log4js.getLogger('wdio-py-reporter');
    this.logger.level = 'debug';
    port = options.port;
    currentReporter = this;
  }

  get currentTest(): undefined | TestStats {
    return this.currentSuites.at(-1)?.tests?.at(-1);
  }

  get currentTestID(): string {
    return this.idMapped[this.currentTest?.uid ?? ''];
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

export async function internalAttachScreenshot(
  title: string,
  content: string,
  entity_id: string,
  description?:string,
) {
  try {
    await superagent.put(
      ReporterContacts.addAttachmentForEntity,
    ).send({
      description,
      content: { title, value: content },
      type: 'PNG',
      entityID: entity_id,
    });
    return false;
  } catch (error) {
    return error;
  }
}
