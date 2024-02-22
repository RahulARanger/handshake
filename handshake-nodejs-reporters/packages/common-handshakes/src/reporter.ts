import log4js, { Level } from 'log4js';
import superagent from 'superagent';
import PQueue, { QueueAddOptions } from 'p-queue';
import PriorityQueue from 'p-queue/dist/priority-queue';
import { writeFile } from 'node:fs';
import DialPad from './dialPad';
import {
  RegisterSession,
  MarkTestEntity, MarkTestSession, RegisterTestEntity, Assertion, Attachment,
} from './payload';
import { acceptableDateString } from './helpers';

const logger = log4js.getLogger('handshake-reporter');

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } },
});

export type IdMappedType = Record<string, string> & { session?: string };

export class ReporterDialPad extends DialPad {
  idMapped: IdMappedType = {};

  misFire: number = 0;

  pipeQueue: PQueue<PriorityQueue, QueueAddOptions>;

  requests: Attachment[] = [];

  constructor(port: number, timeout?:number, logLevel?:Level) {
    super(port);
    logger.level = logLevel ?? 'info';

    this.pipeQueue = new PQueue(
      { concurrency: 1, timeout: timeout ?? 180e3, throwOnTimeout: false },
    );
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

  get addAttachmentsForEntities(): string {
    return `${this.saveUrl}/addAttachmentsForEntities`;
  }

  get writeAttachmentForEntity(): string {
    return `${this.saveUrl}/registerAWrittenAttachments`;
  }

  async office(contact: string, payload?:object, callThisInside?: () => object, storeIn?: string) {
    const feed = JSON.stringify((callThisInside === undefined ? payload : callThisInside()) ?? {});
    logger.debug(
      `Transferred payload: ${feed} to ${contact}.`,
    );

    await superagent.put(contact)
      .send(feed)
      .retry(2)
      .on('response', (result) => {
        const { text, ok } = result;
        if (!ok) {
          logger.error(
            `❌ Server failed to understand the request sent to ${contact} with payload; ${feed}. It attached a note: ${text}`,
          );
          return;
        }

        logger.debug(`✅ Server accepted the request and attached a note: ${text}`);
        if (storeIn) {
          logger.debug(
            `🫙 Storing received response key [${storeIn}] as ${text}`,
          );
          this.idMapped[storeIn] = String(text);
        }
      })
      .catch((err) => {
        this.misFire += 1;
        logger.error(`Failed to send the fax: ${err}`);
      });
  }

  async registerOrUpdateSomething(
    contact: string,
    payload?:object,
    storeIn?: string,
    callThisInside?: () => object,
  ) {
    const job = await this.pipeQueue
      .add(
        () => this.office(contact, payload, callThisInside, storeIn),
      );

    if (this.pipeQueue.size) logger.info(`Queue size in office 🏢: ${this.pipeQueue.size}`);
    return job;
  }

  requestRegisterSession(sessionPayload: RegisterSession) {
    const modifiedPayload = {
      ...sessionPayload,
      started: acceptableDateString(sessionPayload.started),
    };
    return this.registerOrUpdateSomething(this.registerSession, modifiedPayload, 'session');
  }

  /**
   *
   * @param entityID some place where we can store the test id received from the server
   * @param payload payload for registering the suite / test
   */
  requestRegisterTestEntity(
    entityID: string,
    payload: () => RegisterTestEntity,
  ) {
    return this.registerOrUpdateSomething(
      this.registerSuite,
      undefined,
      entityID,
      payload,
    );
  }

  markTestEntity(payload: () => MarkTestEntity) {
    return this.registerOrUpdateSomething(
      this.updateSuite,
      undefined,
      undefined,
      payload,
    );
  }

  markTestSession(payload: (() => MarkTestSession)) {
    this.registerOrUpdateSomething(
      this.addAttachmentsForEntities,
      undefined,
      undefined,
      () => {
        const toSend = [...this.requests];
        this.requests.splice(0, this.requests.length);
        return toSend;
      },
    );

    return this.registerOrUpdateSomething(
      this.updateSession,
      undefined,
      undefined,
      payload,
    );
  }

  async saveAttachment(forWhat: string, payload: Attachment) {
    if (!payload.entityID) {
      logger.warn(`😕 Skipping!, we have not attached a ${forWhat} for unknown entity`);
      return false;
    }

    const { value, ...sendPayload } = payload;

    await superagent
      .put(this.writeAttachmentForEntity)
      .send(JSON.stringify(sendPayload))
      .on('response', async (result) => {
        if (result.ok) {
          const expectedFilePath = result.text;
          logger.debug(`Registered an attachment for ${payload.entityID} saving it here: ${result.text}`);
          await writeFile(expectedFilePath, value as string, () => { logger.info(`saved successfully at: ${result.text}`); });
        } else {
          logger.error(`💔 Failed to attach ${forWhat} for ${payload.entityID}, because of ${result?.text}`);
        }
      }).catch((err) => {
        this.misFire += 1;
        logger.error(`❌ Failed to attach ${forWhat} for ${payload.entityID}, because of ${err}`);
      });
    return true;
  }

  async addDescription(
    content: string,
    entity_id: string,
  ) {
    this.requests.push({
      entityID: entity_id, type: 'DESC', value: content,
    });
  }

  async addLink(
    url: string,
    title: string,
    entity_id: string,
  ) {
    this.requests.push({
      entityID: entity_id, type: 'LINK', value: url, title,
    });
  }

  async addAssertion(
    title: string,
    assertion: Assertion,
    entity_id: string,
  ) {
    this.requests.push({
      entityID: entity_id, type: 'ASSERT', value: assertion, title,
    });
  }

  async attachScreenshot(
    title: string,
    content: string, // can be base64 encoded string
    entity_id: string,
    description?:string,
  ) {
    return this.saveAttachment(
      'screenshot',
      {
        entityID: entity_id, type: 'PNG', value: content, title, description,
      },
    );
  }
}
