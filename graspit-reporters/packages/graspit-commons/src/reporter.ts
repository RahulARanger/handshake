import AsyncLock from 'async-lock';
import log4js from 'log4js';
import superagent from 'superagent';
import DialPad from './dialPad';
import {
  RegisterSession,
  MarkTestEntity, MarkTestSession, RegisterTestEntity,
} from './payload';

const logger = log4js.getLogger('graspit-commons');

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } },
});

export type IdMappedType = Record<string, string> & { session?: string };

export class ReporterDialPad extends DialPad {
  idMapped: IdMappedType = {};

  lockString = 'common-lock';

  lock: AsyncLock;

  constructor(port: number, timeout?:number) {
    super(port);
    this.lock = new AsyncLock({
      timeout: 60e3,
      maxExecutionTime: timeout ?? 60e3,
      maxPending: 1000,
    });
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

  feed(
    feedURL: string,
    feedJSON: object | null,
    keyToBeStored?: null | string,
    dynamicKeys?: () => object,
  ) {
    this.lock.acquire(
      this.lockString,
      async () => {
        if (keyToBeStored !== 'session'
           && this.idMapped.session === undefined) {
          logger.warn(
            '💔 We cannot send requests for any register / mark requests before registering a session',
          );
        }
        const payload = feedJSON || (dynamicKeys ? dynamicKeys() : {});
        logger.info(
          `📠 Faxing, ${feedURL} with payload 📃: ${JSON.stringify(
            payload,
          )}`,
        );
        await superagent.put(feedURL)
          .send(JSON.stringify(payload))
          .on('response', (result) => {
            const { text, ok } = result;
            if (!ok) {
              logger.error(
                `Server rejected the request 🙅 sent through ${feedURL} with payload 📃: ${JSON.stringify(
                  feedJSON,
                )} and attached a note: ${text}`,
              );
              return;
            }

            logger.info(`Server accepted 🙆 the request and attached a note: ${text}`);
            if (keyToBeStored) {
              logger.info(
                `Storing received response key [${keyToBeStored}] 🫙 as ${text}`,
              );
              this.idMapped[keyToBeStored] = String(text);
            }
          });
      },
    ).catch((reason) => {
      logger.error(
        `💔 Failed to send or read the request send through URL: ${feedURL} with payload 📃: ${JSON.stringify(
          feedJSON,
        )} because of ${reason?.message ?? reason}`,
      );
    });
  }

  requestRegisterSession(sessionPayload: RegisterSession) {
    this.feed(this.registerSession, sessionPayload, 'session');
  }

  requestRegisterTestEntity(
    entityID: string,
    payload: RegisterTestEntity | (() => RegisterTestEntity),
  ) {
    const isCallable = typeof payload === 'function';
    this.feed(
      this.registerSuite,
      isCallable ? null : payload,
      entityID,
      isCallable ? payload : undefined,
    );
  }

  markTestEntity(entityID: string, payload: MarkTestEntity | (() => MarkTestEntity)) {
    const isCallable = typeof payload === 'function';
    this.feed(
      this.updateSuite,
      isCallable ? null : payload,
      entityID,
      isCallable ? payload : undefined,
    );
  }

  markTestSession(entityID: string, payload: MarkTestSession | (() => MarkTestSession)) {
    const isCallable = typeof payload === 'function';
    this.feed(
      this.updateSession,
      isCallable ? null : payload,
      entityID,
      isCallable ? payload : undefined,
    );
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
          logger.info(`👍 Attached a Link for ${entity_id}`);
        } else {
          logger.error(`💔 Failed to attach a link: ${url} for ${entity_id}, because of ${result?.text}`);
        }
      });

    return resp?.ok;
  }
}
