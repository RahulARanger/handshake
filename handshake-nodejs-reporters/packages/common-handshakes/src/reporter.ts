import pino, { Level, Logger } from 'pino';
import superagent from 'superagent';
import PQueue, { QueueAddOptions } from 'p-queue';
import PriorityQueue from 'p-queue/dist/priority-queue';
import { existsSync, mkdirSync, writeFile } from 'node:fs';
import { dirname } from 'node:path';
import DialPad from './dialPad';
import {
  RegisterSession,
  MarkTestEntity,
  MarkTestSession,
  RegisterTestEntity,
  Assertion,
  Attachment,
  UpdateTestRun,
} from './payload';
import { acceptableDateString } from './helpers';

export type IdMappedType = Record<string, string> & { session?: string };

export class ReporterDialPad extends DialPad {
  idMapped: IdMappedType = {};

  misFire: number = 0;

  pipeQueue: PQueue<PriorityQueue, QueueAddOptions>;

  requests: Attachment[] = [];

  logger: Logger;

  /**
   * this is where we would feed your test results to the handshake-server
   * we put your requests in queue and send them one by one.
   * @param port port at which we would have started handshake-server
   * @param timeout timeout for the queue
   * @param logLevel log level at the report-feeder level
   */
  constructor(port: number, timeout?: number, logLevel?: Level, disabled?:boolean) {
    super(port, disabled);

    this.logger = pino({ name: 'handshake-report-feeder', level: logLevel?.toLowerCase() ?? 'info' });

    this.pipeQueue = new PQueue({
      concurrency: 1,
      timeout: timeout ?? 180e3,
      throwOnTimeout: false,
    });
  }

  /**
   * url for registering a session
   */
  get registerSession(): string {
    return `${this.saveUrl}/registerSession`;
  }

  /**
   * url for registering a suite
   */
  get registerSuite(): string {
    return `${this.saveUrl}/registerSuite`;
  }

  /**
   * url for registering parent entities
   */
  get registerParentSuites(): string {
    return `${this.saveUrl}/registerParentEntities`;
  }

  /**
   * url for updating a suite
   */
  get updateSuite(): string {
    return `${this.saveUrl}/updateSuite`;
  }

  /**
   * url for updating a session
   */
  get updateSession(): string {
    return `${this.saveUrl}/updateSession`;
  }

  /**
   * url for adding attachment for entities
   */
  get addAttachmentsForEntities(): string {
    return `${this.saveUrl}/addAttachmentsForEntities`;
  }

  /**
   * url for registering an attachment for entity that would be saved inside the test results
   * like images or videos (currently only png files are supported.)
   */
  get writeAttachmentForEntity(): string {
    return `${this.saveUrl}/registerAWrittenAttachment`;
  }

  /**
   * for Updating the test run with the exact information provided by the test framework
   */
  get updateTestRunURL(): string {
    return `${this.saveUrl}/updateTestRun`;
  }

  /**
   * This is the place where we would be sending the test results to the handshake-server.
   *
   *
   * Since we would need to first,
   *
   * register a session --> register a parent suite --> register a child suite --> ...
   * we would need to send some of the requests in an order. hence we have build a queue,
   * which would call this function to send the necessary.
   *
   * some of the payloads would depend over the previous request,
   *  hence we are storing the response of required inside an object with the passed key
   * and we extract the payload from a callable using this key, since it's payload is dynamic.
   * @param contact endpoint to send the feed
   * @param payload feed
   * @param callThisInside get payload from this callable
   * @param storeIn store the response in this key
   */
  async office(
    contact: string,
    payload?: object,
    callThisInside?: () => object,
    storeIn?: string,
    saveHere?: (_: string) => void,
  ) {
    if (this.disabled) return;

    const feed = JSON.stringify(
      (callThisInside === undefined ? payload : callThisInside()) ?? {},
    );
    this.logger.debug({ contact, feed, from: 'office' });

    await superagent
      .put(contact)
      .send(feed)
      .retry(2)
      .on('response', (result) => {
        const { text, ok } = result;
        if (!ok) {
          this.logger.error({
            contact, feed, from: 'office', resp: text,
          });
          return;
        }
        this.logger.debug({
          from: 'office', resp: text, contact, for: 'request-accepted',
        });

        if (storeIn) {
          this.logger.debug({
            from: 'office', resp: text, contact, for: 'store', where: storeIn,
          });

          this.idMapped[storeIn] = String(text);
        }
        if (saveHere) saveHere(String(text));
      })
      .catch((err) => {
        this.misFire += 1;
        this.logger.error({
          from: 'office', contact, for: 'failed', where: storeIn, err,
        });
      });
  }

  /**
 * just a shortcut method for adding a job to queue
 * @param contact url to send the feed for registration or updating
 * @param payload feed
 * @param storeIn stores the results in the provided key
 * @param callThisInside get the payload once it is getting processing
 * @returns
 */
  async registerOrUpdateSomething(
    contact: string,
    payload?: object,
    storeIn?: string,
    callThisInside?: () => object,
    saveHere?: (_: string) => void,
  ) {
    if (this.disabled) return undefined;
    const job = await this.pipeQueue.add(
      () => this.office(contact, payload, callThisInside, storeIn, saveHere),
    );

    if (this.pipeQueue.size) this.logger.info({ for: 'queueSize', size: this.pipeQueue.size });
    return job;
  }

  /**
   * registers a session
   * @param sessionPayload payload for registering a session
   * @returns
   */
  registerTestSession(sessionPayload: RegisterSession) {
    const modifiedPayload = {
      ...sessionPayload,
      started: acceptableDateString(sessionPayload.started),
    };
    return this.registerOrUpdateSomething(
      this.registerSession,
      modifiedPayload,
      'session',
    );
  }

  /**
  * registers a test entity [suite/test/hook]
  * @param entityID some place where we can store the test id received from the server
  * @param payload payload for registering the suite / test
  */
  registerTestEntity(
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

  registerParentHierarchy(
    parentEntities: () => Array<RegisterTestEntity | string>,
    toSaveBy: (_: string) => void,
  ) {
    return this.registerOrUpdateSomething(
      this.registerParentSuites,
      undefined,
      undefined,
      parentEntities,
      toSaveBy,
    );
  }

  /**
   * updates a test entity [suite/test/hook]
   * @param payload payload for updating test entity
   * @returns
   */
  updateTestEntity(payload: () => MarkTestEntity) {
    return this.registerOrUpdateSomething(
      this.updateSuite,
      undefined,
      undefined,
      payload,
    );
  }

  /**
   * updates the test session
   * @param payload payload for updating test sesssion
   * @returns
   */
  updateTestSession(payload: () => MarkTestSession) {
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

  updateTestRun(payload: UpdateTestRun) {
    return this.registerOrUpdateSomething(
      this.updateTestRunURL,
      undefined,
      undefined,
      () => payload,
    );
  }

  /**
 * note: we are assuming the value inside the payload -> value is of base64
 * @param forWhat label for the attachment
 * @param payload payload for your attachment
 * @returns true if passed
 */
  async saveAttachment(forWhat: string, payload: Attachment) {
    if (!payload.entityID) {
      this.logger.warn(
        { forWhat, for: 'skipping', reason: 'no Test entity found' },
      );
      return undefined;
    }

    let pipeOutput: string | false = false;

    const { value, ...sendPayload } = payload;

    await superagent
      .put(this.writeAttachmentForEntity)
      .send(JSON.stringify(sendPayload))
      .on('response', async (result) => {
        if (result.ok) {
          const expectedFilePath = result.text;
          this.logger.debug(
            { path: result.text, for: 'registered attachment' },
          );

          const attachmentFolderForTestRun = dirname(dirname(expectedFilePath));
          if (!existsSync(attachmentFolderForTestRun)) {
            mkdirSync(attachmentFolderForTestRun);
            // we are supposed to ensure the folders for the test runs
          }
          const attachmentFolderForEntity = dirname(expectedFilePath);
          if (!existsSync(attachmentFolderForEntity)) {
            mkdirSync(attachmentFolderForEntity);
            // we are supposed to ensure the folders for the test entities
          }

          await writeFile(
            expectedFilePath,
            value as string,
            { encoding: 'base64' },
            () => {
              this.logger.debug(
                { for: 'save-attachment', path: result.text },
              );
            },
          );
          pipeOutput = expectedFilePath;
        } else {
          this.logger.error(
            { forWhat, entity: payload.entityID, reason: result?.text ?? 'no-resp-found' },
          );
        }
      })
      .catch((err) => {
        this.misFire += 1;
        this.logger.error(
          { forWhat, error: err, entity: payload.entityID },
        );
      });
    return pipeOutput;
  }

  /**
   * adds description to the test entity
   * @param content description
   * @param entity_id attached to ?
   */
  async addDescription(content: string, entity_id: string) {
    this.requests.push({
      entityID: entity_id,
      type: 'DESC',
      value: content,
    });
  }

  /**
   * attaches a link to the test entity
   * @param url url
   * @param title title for the url
   * @param entity_id test entity
   */
  async addLink(url: string, title: string, entity_id: string) {
    this.requests.push({
      entityID: entity_id,
      type: 'LINK',
      value: url,
      title,
    });
  }

  /**
   * adds assertion details of an test entity
   * @param title title for the assertion
   * @param assertion assertion object
   * @param entity_id test entity
   */
  async addAssertion(title: string, assertion: Assertion, entity_id: string) {
    this.requests.push({
      entityID: entity_id,
      type: 'ASSERT',
      value: assertion,
      title,
    });
  }

  /**
   * attaches a screenshot to the test entity
   * @param title title of the screenshot
   * @param content content of the screenshot (data)
   * @param entity_id test entity
   * @param description description of it
   * @returns
   */
  async attachScreenshot(
    title: string,
    content: string, // can be base64 encoded string
    entity_id: string,
    description?: string,
  ) {
    return this.saveAttachment('screenshot', {
      entityID: entity_id,
      type: 'PNG',
      value: content,
      title,
      description,
    });
  }

  async completeJobs() {
    this.logger.info({ message: 'waiting for the jobs to be completed', for: 'pipeQueue' });
    await this.pipeQueue.onIdle();
    this.logger.info({ message: 'jobs are now completed', for: 'pipeQueue' });
  }
}
