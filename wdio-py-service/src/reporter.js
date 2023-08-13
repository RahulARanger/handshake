/* eslint-disable import/no-unresolved */
import WDIOReporter from '@wdio/reporter';
import logger from '@wdio/logger';
import AsyncLock from 'async-lock';

/**
 *
 * @param {Date | undefined} endDate end date of the test entity
 * @param {string[] | undefined} failures list of failures if there else undefined
 * @returns {string} returns the status of the test on "before" hook
 */
function returnStatus(endDate, failures) {
    if (!endDate) return 'PENDING';
    return failures?.length ? 'FAILED' : 'PASSED';
}

export default class NeXtReporter extends WDIOReporter {
    logger = logger('wdio-py-reporter');

    lock = new AsyncLock();

    packing = false; // false if its free

    port = 6969;

    get url() {
        return `http://127.0.0.1:${this.port}`;
    }

    get saveUrl() {
        return `${this.url}/save`;
    }

    get addFeatureUrl() {
        return `${this.saveUrl}/addFeature`;
    }

    get addSuiteUrl() {
        return `${this.saveUrl}/addSuite`;
    }

    get registerSession() {
        return `${this.saveUrl}/registerSession`;
    }

    get registerSuite() {
        return `${this.saveUrl}/registerSuite`;
    }

    get updateSuite() {
        return `${this.saveUrl}/updateSuite`;
    }

    get updateSession() {
        return `${this.saveUrl}/updateSession`;
    }

    /**
     *
     * @param {{port?: number}} options Options for the reporter
     */
    constructor(options) {
        super(options);
        this.port = options.port ?? this.port;
    }

    /**
     * @typedef {import("@wdio/reporter").RunnerStats} RunnerStats
     * @param {RunnerStats} stats Stats when starting the Runner
     */
    async onRunnerStart(stats) {
        /**
         * @type {number}
         */

        const [startDate, endDate] = [stats.start.toUTCString(), stats.end?.toUTCString()];
        const standing = returnStatus(stats.end, stats.failures);
        const {
            failures, duration,
        } = stats;
        const totalRetries = stats.retries;
        const retried = stats.retry;
        const [browserName, browserVersion, platformName] = stats.sanitizedCapabilities.split('.');

        const { framework, logLevel, automationProtocol } = this.runnerStat.config;
        const { specs } = this;
        const suitesConfig = this.runnerStat.config.suites;

        const payload = {
            duration,
            startDate,
            endDate,
            standing,
            browserName,
            failures,
            retried,
            totalRetries,
            platformName,
            browserVersion,
            sessionID: this.runnerStat.sessionId,
            framework,
            logLevel,
            specs,
            suitesConfig,
            automationProtocol,
        };

        await this.lock.acquire(this.runnerStat.sessionId, async () => {
            const resp = await (await fetch(this.registerSession, { method: 'PUT', body: JSON.stringify(payload) })).text();
            this.logger.info(`Registered a session: ${resp}`);
        });
    }

    /**
     * @typedef {import("@wdio/reporter").SuiteStats} SuiteStats
     * @typedef {import("@wdio/reporter").TestStats} TestStats
     * @param {SuiteStats | TestStats} suiteOrTest Can either be a suite or a test
     * @returns {{description, title, parent, fullTitle,
     *  file, tags, standing, startDate, endDate, session_id, totalRetries, retried}}
     * returns the info that is crucial to the suite or test
     */
    extractSuiteOrTestDetails(suiteOrTest) {
        const {
            duration, title, fullTitle, file, tags,
            // , description,
            //  rule,
            // above commented keys are for the Gherkin Files
        } = suiteOrTest;
        const startDate = suiteOrTest.start.toUTCString();
        const endDate = suiteOrTest.end?.toUTCString();
        const parent = suiteOrTest?.parent ? `${this.currentSuites.at(-1).start.toUTCString()}-${this.currentSuites.at(-1).uid}` : '';
        const payload = {
            duration,
            title,
            parent,
            suiteID: `${startDate}-${suiteOrTest.uid}`,
            fullTitle,
            file,
            standing: returnStatus(suiteOrTest.end, this.runnerStat.failures),
            tags: tags ?? [],
            startDate,
            endDate,
            session_id: this.runnerStat.sessionId,
            totalRetries: this.runnerStat.retries,
            retried: this.runnerStat.retry,
        };
        return payload;
    }

    /**
     * @param {SuiteStats | TestStats} suiteOrTest Can either be a suite or a test
     * @returns {{duration, startDate, endDate, failures, specs, sessionID, standing}}
     * returns the info that needs to be updated for either suite or test
     */
    extractRequiredForCompletion(suiteOrTest) {
        const {
            duration, specs,
        } = suiteOrTest;

        const startDate = suiteOrTest.start.toUTCString();
        const endDate = suiteOrTest?.end ? suiteOrTest.end.toUTCString() : '';
        const suiteState = suiteOrTest?.state ?? 'YET_TO_CALC';

        const payload = {
            duration,
            startDate,
            suiteID: `${startDate}-${suiteOrTest.uid}`,
            endDate,
            failures: this.runnerStat.failures,
            specs,
            sessionID: this.runnerStat.sessionId,
            standing: suiteState.toUpperCase(),
        };

        return payload;
    }

    /**
     *
     * @param {SuiteStats} suite stats provided for a suite
     */
    async onSuiteStart(suite) {
        const payload = this.extractSuiteOrTestDetails(suite);
        payload.suiteType = 'SUITE';

        await this.lock.acquire(this.runnerStat.sessionId, async () => {
            const resp = await (await fetch(this.registerSuite, { method: 'PUT', body: JSON.stringify(payload) })).text();
            this.logger.info(`Registered ${suite.title} | ${resp}`);
        });
    }

    /**
     *
     * @param {SuiteStats} suite stats provided for a suite
     */
    async onSuiteEnd(suite) {
        const payload = this.extractRequiredForCompletion(suite);
        payload.suiteType = 'SUITE';

        await this.lock.acquire(this.runnerStat.sessionId, async () => {
            const resp = await (await fetch(this.updateSuite, { method: 'PUT', body: JSON.stringify(payload) })).text();
            this.logger.info(`Updated Suite: ${suite.title} | ${resp}`);
        });
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    async addTest(test) {
        const payload = this.extractSuiteOrTestDetails(test);
        payload.suiteType = 'TEST';

        await this.lock.acquire(this.runnerStat.sessionId, async () => {
            const resp = await (await fetch(this.registerSuite, { method: 'PUT', body: JSON.stringify(payload) })).text();
            this.logger.info(`Registered ${test.title} from session: ${this.runnerStat.sessionId} | ${resp}`);
        });
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    async onTestStart(test) {
        await this.addTest(test);
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    async markTestCompletion(test) {
        const payload = this.extractRequiredForCompletion(test);
        payload.suiteType = 'TEST';

        await this.lock.acquire(this.runnerStat.sessionId, async () => {
            const resp = await (await fetch(this.updateSuite, { method: 'PUT', body: JSON.stringify(payload) })).text();
            this.logger.info(`Updated Test: ${test.title} | ${resp}`);
        });
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    async onTestEnd(test) {
        await this.markTestCompletion(test);
    }

    async onTestSkip(test) {
        // skipped tests are not registered
        // this.packing = true;
        await this.addTest(test);
        await this.markTestCompletion(test);
        // this.packing = false;
    }

    /**
     *
     * @param {RunnerStats} runner
     * info regarding the session, it is required for updating the registered session
     */
    async onRunnerEnd(runner) {
        const endDate = runner.end?.toUTCString();
        const {
            passes: passed, failures: failed, skipping: skipped, tests,
        } = this.counts;
        const retried = runner.retries;
        const standing = returnStatus(runner.end, runner.failures);

        const payload = {
            passed,
            failed,
            skipped,
            endDate,
            tests,
            retried,
            standing,
            sessionID: this.runnerStat.sessionId,
        };

        await this.lock.acquire(payload.sessionID, async () => {
            const resp = await (await fetch(this.updateSession, { method: 'PUT', body: JSON.stringify(payload) })).text();
            this.logger.info(`Session: ${this.runnerStat.sessionId} is updated | ${resp}`);
        });
    }

    /**
     * Return true if we have completed blocking operation
     * @returns {boolean} Return true if we have completed sending data
     */
    isSynchronised() {
        return !this.lock.isBusy();
    }
}
