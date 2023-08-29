/* eslint-disable import/no-unresolved */
import { relative } from 'node:path';
import WDIOReporter from '@wdio/reporter';
import logger from '@wdio/logger';
import AsyncLock from 'async-lock';
import fetch from 'node-fetch';

/**
 *
 * List of options which we could use for the reporter:
 *   outputDir: path to the directory where our results folder will be written (default: cwd)
 *   port: specify the port number to use for listening to our test results (default: 6969)
 * @typedef {{port?: number}} ReporterOptions
 */

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

    lock = new AsyncLock({ timeout: 60e3, maxExecutionTime: 60e3, maxPending: 1000 });

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

    get getService() {
        return `${this.url}/get`;
    }

    /**
     *
     * @param {ReporterOptions} options Options for the reporter
     */
    constructor(options) {
        super(options);
        this.port = options.port ?? this.port;
    }

    /**
     *
     * @param {string} feedURL url to use for sending the request to
     * @param {any} feedJSON request body
     */
    feed(feedURL, feedJSON) {
        this.lock.acquire(
            this.runnerStat.config.framework,
            async (done) => {
                this.logger.info(`Requesting ${feedURL} with args: ${JSON.stringify(feedJSON)}`);
                const resp = await fetch(feedURL, { method: 'PUT', body: JSON.stringify(feedJSON), keepalive: true });
                done(Math.floor(resp.status / 200) === 1
                    ? undefined : resp.statusText, await resp.text());
            },
            (er, text) => {
                try {
                    if (er) this.logger.error(JSON.stringify(JSON.parse(er), null, 4));
                    else this.logger.info(text);
                } catch {
                    this.logger.info(text);
                }
            },
        );
    }

    /**
     * @param {SuiteStats | TestStats} suiteOrTest Can either be a suite or a test
     * @returns {RegisterSuite}
     * returns the info that is crucial to the suite or test
     */
    extractSuiteOrTestDetails(suiteOrTest) {
        const {
            title, fullTitle, file, tags,
            // , description,
            //  rule,
            // above commented keys are for the Gherkin Files
        } = suiteOrTest;
        const started = suiteOrTest.start.toISOString();

        const isSuite = suiteOrTest.uid.includes('suite');
        // NOTE: in webdriverio, we do not need to worry about whether the order of suites
        // since specs can execute parallely but not the suites
        const parentIndex = isSuite ? -2 : -1;
        const parent = suiteOrTest?.parent ? `${this.currentSuites.at(parentIndex).start.toISOString()}-${this.currentSuites.at(parentIndex).uid}` : '';

        const payload = {
            title,
            parent,
            suiteID: `${started}-${suiteOrTest.uid}`,
            fullTitle,
            description: '',
            file: relative(process.cwd(), file ?? this.currentSuites.at(-1).file),
            standing: suiteOrTest?.state?.toUpperCase() ?? 'YET_TO_CALC',
            tags: tags ?? [],
            started,
            session_id: this.runnerStat.sessionId,
            retried: this.runnerStat.retry,
        };
        return payload;
    }

    /**
     * @param {SuiteStats | TestStats} suiteOrTest Can either be a suite or a test
     * @returns {MarkSuite}
     * returns the info that needs to be updated for either suite or test
     */
    // eslint-disable-next-line class-methods-use-this
    extractRequiredForCompletion(suiteOrTest) {
        const {
            duration,
        } = suiteOrTest;

        const started = suiteOrTest.start.toISOString();
        const ended = suiteOrTest?.end ? suiteOrTest.end.toISOString() : new Date().toISOString();
        const standing = (suiteOrTest.uid.includes('test') ? (suiteOrTest?.state || 'PENDING') : 'YET_TO_CALC').toUpperCase();
        const { errors, error } = suiteOrTest;

        const payload = {
            duration,
            suiteID: `${started}-${suiteOrTest.uid}`,
            ended,
            standing,
            errors,
            error,
        };

        return payload;
    }

    /**
     * @param {RunnerStats} stats Stats when starting the Runner
     */
    onRunnerStart(stats) {
        /**
         * @type {number}
         */
        const standing = returnStatus(stats.end, stats.failures);
        const {
            failures,
        } = stats;
        const retried = stats.retry;
        const [browserName, browserVersion] = stats.sanitizedCapabilities.split('.');

        const { specs } = this;
        const suitesConfig = this.runnerStat.config.suites;

        /**
         * @type {RegisterSession}
         */
        const payload = {
            started: stats.start.toISOString(),
            standing,
            browserName,
            failed: failures ?? 0,
            retried,
            browserVersion,
            sessionID: this.runnerStat.sessionId,
            specs: (specs ?? []).map((spec) => relative(process.cwd(), spec.startsWith('file:///') ? decodeURI(spec.slice(8)) : spec)),
            suitesConfig,
        };

        this.feed(this.registerSession, payload);
    }

    /**
     *
     * @param {SuiteStats} suite stats provided for a suite
     */
    onSuiteStart(suite) {
        const payload = this.extractSuiteOrTestDetails(suite);
        payload.suiteType = 'SUITE';
        this.feed(this.registerSuite, payload);
    }

    /**
     *
     * @param {SuiteStats} suite stats provided for a suite
     */
    onSuiteEnd(suite) {
        const payload = this.extractRequiredForCompletion(suite);
        this.feed(this.updateSuite, payload);
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    addTest(test) {
        const payload = this.extractSuiteOrTestDetails(test);
        payload.suiteType = 'TEST';
        this.feed(this.registerSuite, payload);
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    onTestStart(test) {
        this.addTest(test);
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    markTestCompletion(test) {
        const payload = this.extractRequiredForCompletion(test);
        this.feed(this.updateSuite, payload);
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    onTestEnd(test) {
        this.markTestCompletion(test);
    }

    onTestSkip(test) {
        // skipped tests are not registered
        // this.packing = true;
        this.addTest(test);
        this.markTestCompletion(test);
        // this.packing = false;
    }

    /**
     *
     * @param {RunnerStats} runner
     * info regarding the session, it is required for updating the registered session
     */
    onRunnerEnd(runner) {
        const ended = runner.end?.toISOString();
        const {
            passes: passed, skipping: skipped, tests, failures: failed,
        } = this.counts;
        const retried = runner.retries;
        const standing = returnStatus(runner.end, runner.failures);

        const payload = {
            duration: this.runnerStat.duration,
            passed,
            failed,
            skipped,
            tests,
            ended,
            retried,
            standing,
            sessionID: this.runnerStat.sessionId,
        };

        this.feed(this.updateSession, payload);
    }

    /**
     * Return true if we have completed blocking operation
     * saves us from race condition
     * @returns {boolean} Return true if we have completed sending data
     */
    get isSynchronised() {
        return !this.lock.isBusy();
    }
}

/**
 * @typedef {"PENDING" | "PASSED" | "FAILED"} standing
 * @typedef {import("@wdio/reporter").SuiteStats} SuiteStats
 * @typedef {import("@wdio/reporter").TestStats} TestStats
 * @typedef {import("@wdio/reporter").RunnerStats} RunnerStats
 * @typedef {{message: string, stack?:string, name: string}} Error
 */

/**
 * @typedef {object} CommonRegisterCols
 * @property {string} started start date-time of the session
 * @property {number} retried number of times this test case has been retried
 * @property {standing} standing status of the execution
 */

/**
 * @typedef {object} RegisterSessionSpecific
 * @property {string} browserName name of the browser used
 * @property {string} browserVersion version of the browser used
 * @property {string} sessionID session it is depended on
 * @property {string[]} specs list of specs files that it will execute
 * @property {{[key: string]: string | string[]}} suitesConfig list of suites and its configuration
 * @typedef {RegisterSessionSpecific & CommonRegisterCols} RegisterSession
 */

/**
 * @typedef {object} RegisterSuiteSpecific
 * @property {string} description summary of the test entity
 * @property {string} file residence file of the test entity
 * @property {string} parent parent id of the test entity
 * @property {standing} standing status of its result
 * @property {string} suiteID it's id
 * @property {string} session_id id of its session
 * @property {string} title it's subject
 * @property {string} fullTitle little detailed title
 * @typedef {RegisterSuiteSpecific & CommonRegisterCols} RegisterSuite
 */

/**
 * @typedef {object} MarkSuite
 * @property {string} suiteID it's id
 * @property {standing} standing status of its result
 * @property {number} duration duration it took to complete
 * @property {string} ended date-time at its completion
 * @property {Error} error error if any
 * @property {Error[]} errors errors if any
 */
