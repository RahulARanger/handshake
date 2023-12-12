import log4js from 'log4js';
import superagent from 'superagent';
import PQueue, { QueueAddOptions } from 'p-queue';
import PriorityQueue from 'p-queue/dist/priority-queue';
import DialPad from './dialPad';
import {
  RegisterSession,
  MarkTestEntity, MarkTestSession, RegisterTestEntity, Assertion, Attachment,
} from './payload';
import { acceptableDateString } from './helpers';

const logger = log4js.getLogger('handshake-commons');

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } },
});

export type IdMappedType = Record<string, string> & { session?: string };

export class ReporterDialPad extends DialPad {
  idMapped: IdMappedType = {};

  misFire: number = 0;

  pipeQueue: PQueue<PriorityQueue, QueueAddOptions>;

  constructor(port: number, timeout?:number) {
    super(port);
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

  get addAttachmentForEntity(): string {
    return `${this.saveUrl}/addAttachmentForEntity`;
  }

  get writeAttachmentForEntity(): string {
    return `${this.writeUrl}/addAttachmentForEntity`;
  }

  async office(contact: string, payload?:object, callThisInside?: () => object, storeIn?: string) {
    const feed = (callThisInside === undefined ? payload : callThisInside()) ?? {};
    logger.info(
      `📠 Faxing ${callThisInside === undefined ? 'static' : 'dynamic'} payload 📃: ${JSON.stringify(
        payload,
      )} to ${contact}`,
    );

    await superagent.put(contact)
      .send(JSON.stringify(feed))
      .on('response', (result) => {
        const { text, ok } = result;
        if (!ok) {
          logger.error(
            `🏮 Server failed to understand the request sent to ${contact} with payload 📃: ${JSON.stringify(
              feed,
            )}. so it attached a note: ${text}`,
          );
          return;
        }

        logger.info(`✅ Server accepted the request and attached a note: ${text}`);
        if (storeIn) {
          logger.info(
            `🫙 Storing received response key [${storeIn}] as ${text}`,
          );
          this.idMapped[storeIn] = String(text);
        }
      }).catch((err) => {
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

    logger.info(`queue size in office 🏢: ${this.pipeQueue.size}`);
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

  markTestEntity(entityID: string, payload: () => MarkTestEntity) {
    return this.registerOrUpdateSomething(
      this.updateSuite,
      undefined,
      entityID,
      payload,
    );
  }

  markTestSession(entityID: string, payload: MarkTestSession | (() => MarkTestSession)) {
    const isCallable = typeof payload === 'function';
    this.registerOrUpdateSomething(
      this.updateSession,
      isCallable ? undefined : payload,
      entityID,
      isCallable ? payload : undefined,
    );
  }

  async saveAttachment(hardSave: boolean, forWhat: string, payload: Attachment) {
    if (!payload.entityID) {
      logger.warn(`😕 Skipping!, we have not attached a ${forWhat} for unknown entity`);
      return false;
    }
    const resp = await superagent
      .put(hardSave ? this.writeAttachmentForEntity : this.addAttachmentForEntity)
      .send(JSON.stringify(payload))
      .on('response', (result) => {
        if (result.ok) {
          logger.info(`📸 Attached a ${forWhat}, id: ${result.text} for: ${payload.entityID}`);
        } else {
          logger.error(`💔 Failed to attach screenshot for ${payload.entityID}, because of ${result?.text}`);
        }
      });

    return resp.text;
  }

  async attachScreenshot(
    title: string,
    content: string, // can be base64 encoded string
    entity_id: string,
    description?:string,
  ) {
    if (!entity_id) {
      logger.warn('😕 Skipping!, we have not attached a screenshot for unknown entity');
      return false;
    }
    const payload = JSON.stringify({
      description,
      title,
      value: content,
      type: 'PNG',
      entityID: entity_id,
    });

    const resp = await superagent
      .put(this.writeAttachmentForEntity)
      .send(payload)
      .on('response', (result) => {
        if (result.ok) {
          logger.info(`📸 Attached a screenshot [PNG], id: ${result.text} for: ${entity_id}`);
        } else {
          logger.error(`💔 Failed to attach screenshot for ${entity_id}, because of ${result?.text}`);
        }
      });

    return resp.text;
  }

  async addDescription(
    content: string,
    entity_id: string,
  ) {
    if (!entity_id) {
      logger.warn('😕 Skipping!, we have not added a description for unknown entity');
      return false;
    }
    const payload = JSON.stringify({
      value: content,
      type: 'DESC',
      entityID: entity_id,
    });

    const resp = await superagent
      .put(this.addAttachmentForEntity)
      .send(payload)
      .on('response', (result) => {
        if (result.ok) {
          logger.info(`👍 Added Description for ${entity_id}`);
        } else {
          logger.error(`💔 Failed to add description for ${entity_id}, because of ${result?.text}`);
        }
      });

    return resp?.ok;
  }

  async addLink(
    url: string,
    title: string,
    entity_id: string,
  ) {
    if (!entity_id) {
      logger.warn('😕 Skipping!, we have not added a link for unknown entity');
      return false;
    }
    const payload = JSON.stringify({
      title,
      value: url,
      type: 'LINK',
      entityID: entity_id,
    });

    const resp = await superagent
      .put(this.addAttachmentForEntity)
      .send(payload)
      .on('response', (result) => {
        if (result.ok) {
          logger.info(`Attached a 🔗 Link for ${entity_id}`);
        } else {
          logger.error(`💔 Failed to attach a link: ${url} for ${entity_id}, because of ${result?.text}`);
        }
      });

    return resp?.ok;
  }

  async addAssertion(
    assertion: Assertion,
    entity_id: string,
  ) {
    if (!entity_id) {
      logger.warn('😕 Skipping!, we have not added a link for unknown entity');
      return false;
    }
    const payload = JSON.stringify({
      type: 'ASSERT',
      value: JSON.stringify(assertion),
      entityID: entity_id,
      title: assertion.matcherName,
    });

    const resp = await superagent
      .put(this.addAttachmentForEntity)
      .send(payload)
      .on('response', (result) => {
        if (result.ok) {
          logger.info(`Added an 🧪 assertion: ${assertion.matcherName} for ${entity_id}`);
        } else {
          logger.error(`💔 Failed to attach an assertion; ${assertion.matcherName} for ${entity_id}, because of ${result?.text}`);
        }
      });

    return resp?.ok;
  }
}
