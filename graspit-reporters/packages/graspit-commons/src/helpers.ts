import AsyncLock from 'async-lock';
import log4js from 'log4js';
import superagent from 'superagent';
import DialPad from './dialPad';

const logger = log4js.getLogger('graspit-commons');

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } },
});

export type IdMappedType = Record<string, string> & { session?: string };

export class ReporterDialPad extends DialPad {
  idMapped: IdMappedType = {};

  lock = new AsyncLock({
    timeout: 60e3,
    maxExecutionTime: 60e3,
    maxPending: 1000,
  });

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

  get addAttachmentForEntity(): string {
    return `${this.saveUrl}/addAttachmentForEntity`;
  }

  feed(
    feedURL: string,
    feedJSON: object | null,
    keyToBeStored?: null | string,
    dynamicKeys?: () => object,
  ) {
    this.lock.acquire(
      'common-lock',
      async (done) => {
        if (
          keyToBeStored !== 'session' && this.idMapped.session === undefined
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
          this.idMapped[keyToBeStored] = String(text);
        } else logger.info(`🗳️ - ${text}`);
      },
    );
  }

  async attachScreenshot(
    title: string,
    content: string,
    entity_id: string,
    description?:string,
  ) {
    const payload = JSON.stringify({
      description,
      title,
      value: content,
      type: 'PNG',
      entityID: entity_id,
    });

    logger.info(`📸 Attaching a screenshot [PNG] with payload: ${entity_id}, 📞 ${this.addAttachmentForEntity}`);

    const resp = await superagent
      .put(this.addAttachmentForEntity)
      .send(payload)
      .on('error', (err) => {
        logger.error(`💔 Failed to attach screenshot, requested: ${payload}, because of ${err}`);
      });
    return resp.statusCode === 200;
  }

  async addDescription(
    content: string,
    entity_id: string,
  ) {
    const payload = JSON.stringify({
      value: content,
      type: 'DESC',
      entityID: entity_id,
    });

    logger.info(`✍️ Added Description with payload: ${entity_id}, 📞 ${this.addAttachmentForEntity}`);

    const resp = await superagent
      .put(this.addAttachmentForEntity)
      .send(payload)
      .on('error', (err) => {
        logger.error(`💔 Failed to set description, requested: ${payload}, because of ${err}`);
      });
    return resp.statusCode === 200;
  }
}
