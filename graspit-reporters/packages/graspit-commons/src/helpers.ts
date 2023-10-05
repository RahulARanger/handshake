import AsyncLock from 'async-lock';
import log4js from 'log4js';
import superagent from 'superagent';

const logger = log4js.getLogger('graspit-commons');

let port: undefined | number;

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } },
});

const lock = new AsyncLock({
  timeout: 60e3,
  maxExecutionTime: 60e3,
  maxPending: 1000,
});

export type IdMappedType = Record<string, string> & { session?: string };
const idMapped: IdMappedType = {};

export default class ReporterDialPad {
  static get url(): string {
    return `http://127.0.0.1:${port}`;
  }

  static get saveUrl(): string {
    return `${this.url}/save`;
  }

  static get addFeatureUrl(): string {
    return `${this.saveUrl}/addFeature`;
  }

  static get addSuiteUrl(): string {
    return `${this.saveUrl}/addSuite`;
  }

  static get registerSession(): string {
    return `${this.saveUrl}/registerSession`;
  }

  static get registerSuite(): string {
    return `${this.saveUrl}/registerSuite`;
  }

  static get updateSuite(): string {
    return `${this.saveUrl}/updateSuite`;
  }

  static get updateSession(): string {
    return `${this.saveUrl}/updateSession`;
  }

  static get addAttachmentForEntity(): string {
    return `${this.saveUrl}/addAttachmentForEntity`;
  }

  static get updateRunConfig(): string {
    return `${this.saveUrl}/currentRun`;
  }

  static get port(): undefined | number {
    return port;
  }

  static set port(toSet: number | undefined) {
    port = toSet;
  }

  static get idMapped(): IdMappedType {
    return idMapped;
  }

  static async attachScreenshot(
    title: string,
    content: string,
    entity_id: string,
    description?:string,
  ) {
    logger.info(`📸 Attaching a screenshot [PNG] with ${title} for ${entity_id}`);
    try {
      await superagent
        .put(this.addAttachmentForEntity)
        .send({
          description,
          content: { title, value: content },
          type: 'PNG',
          entityID: entity_id,
        });
      return false;
    } catch (error) {
      logger.error(`💔 Failed to attach a screenshot [PNG] for ${entity_id} because of ${error}`);
      return error;
    }
  }
}

export function feed(
  feedURL: string,
  feedJSON: object | null,
  keyToBeStored?: null | string,
  dynamicKeys?: () => object,
) {
  lock.acquire(
    'common-lock',
    async (done) => {
      if (
        keyToBeStored !== 'session' && ReporterDialPad.idMapped.session === undefined
      ) {
        logger.warn(
          '💔 Did not find live session, would fail in the next iteration',
        );
      }

      const payload = feedJSON || (dynamicKeys ? dynamicKeys() : {});
      logger.info(
        `🚚 URL: ${feedURL} || 📃 payload: ${JSON.stringify(
          payload,
        )}`,
      );
      const resp = await superagent.put(feedURL)
        .send(JSON.stringify(payload))
        .on('error', (err) => { throw new Error(err); });

      done(
        resp.ok ? undefined : new Error(`Found this status: ${resp.status} with body: ${resp.body}`),
        resp.text,
      );
    },
    (er, _text) => {
      const text = String(_text);

      if (er) {
        logger.error(
          `💔 URL: ${feedURL}, FOOD: ${JSON.stringify(
            feedJSON,
          )} | Message: ${er.message} || Response: ${text}`,
        );
      } else if (keyToBeStored) {
        logger.info(
          `Found 🤠 Key : ${keyToBeStored} | ${text}`,
        );
        ReporterDialPad.idMapped[keyToBeStored] = String(text);
      } else logger.info(`🗳️ - ${text}`);
    },
  );
}
