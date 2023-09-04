/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import logger from '@wdio/logger';
import AsyncLock from 'async-lock';
import fetch from 'node-fetch';
import { RunnerStats, SuiteStats, TestStats } from '@wdio/reporter';
import extractSessionDetailsForRegistration, { extractSessionDetailsForCompletion, returnSuiteID, sanitizePaths } from './extractors.js';
import { ReporterEndpoints } from './referenceUrls.js';

/**
 *
 * List of options which we could use for the reporter:
 *   outputDir: path to the directory where our results folder will be written (default: cwd)
 *   port: specify the port number to use for listening to our test results (default: 6969)
 * @typedef {{port?: number}} ReporterOptions
 */

export default class NeXtReporter extends ReporterEndpoints {
    logger = logger('wdio-py-reporter');

    lock = new AsyncLock({ timeout: 60e3, maxExecutionTime: 60e3, maxPending: 1000 });

    /**
     *
     * @param {ReporterOptions} options Options for the reporter
     */
    constructor(options) {
        super(options);
        if (!this.options.port) { throw new Error("Port is required for allocating server's place"); }
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
                this.logger.info(`🚚 URL: ${feedURL} || 📃 payload: ${JSON.stringify(feedJSON)}`);
                const resp = await fetch(
                    feedURL,
                    { method: 'PUT', body: JSON.stringify(feedJSON), keepalive: true },
                );

                done(resp.ok ? undefined : new Error(resp.statusText), await resp.text());
            },
            (er, text) => {
                if (er) this.logger.error(`💔 ${feedURL} - ${er.message} || ${text}`);
                else this.logger.info(`🗳️ - ${text}`);
            },
        );
    }

    /**
     * Returns the ID of the parent entity if found
     * @param {SuiteStats | TestStats} suiteOrTest test entity
     * @returns {string | ""} parent id of the requested entity
     */
    fetchParent(suiteOrTest) {
        switch (this.runnerStat.config.framework) {
        case 'cucumber': {
            const expectedParent = suiteOrTest.parent;
            const fetchedParent = this.suites[expectedParent];
            if (!fetchedParent) return '';
            return returnSuiteID(fetchedParent);
        }
        default: {
            const isSuite = suiteOrTest.uid.includes('suite');
            return suiteOrTest.parent ? returnSuiteID(this.currentSuites.at(isSuite ? -2 : -1)) : '';
        }
        }
    }

    /**
     * extracts the required information for registering a test entity [suite / test]
     * @param {SuiteStats | TestStats} suiteOrTest Can either be a suite or a test
     * @returns {RegisterSuite} payload for registering a suite
     * returns the info that is crucial to the suite or test
     */
    extractRegistrationPayloadForTestEntity(suiteOrTest) {
        const {
            title, fullTitle, file, tags,
            description,
            //  rule,
            // above commented keys are for the Gherkin Files
        } = suiteOrTest;
        const started = suiteOrTest.start.toISOString();

        const payload = {
            title,
            parent: this.fetchParent(suiteOrTest),
            suiteID: `${started}-${suiteOrTest.uid}`,
            fullTitle: fullTitle ?? '',
            description: description ?? '',
            file: sanitizePaths([file ?? this.currentSuites.at(-1).file]).at(0),
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
    extractRequiredForEntityCompletion(suiteOrTest) {
        const {
            duration,
        } = suiteOrTest;

        const started = suiteOrTest.start.toISOString();
        const ended = suiteOrTest?.end ? suiteOrTest.end.toISOString() : new Date().toISOString();
        const standing = (suiteOrTest.type === 'test' ? (suiteOrTest?.state || 'PENDING') : 'YET_TO_CALC').toUpperCase();
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
        this.feed(this.registerSession, extractSessionDetailsForRegistration(stats));
    }

    /**
     *
     * @param {SuiteStats} suite stats provided for a suite
     */
    onSuiteStart(suite) {
        const payload = this.extractRegistrationPayloadForTestEntity(suite);
        payload.suiteType = 'SUITE';
        this.feed(this.registerSuite, payload);
    }

    /**
     *
     * @param {SuiteStats} suite stats provided for a suite
     */
    onSuiteEnd(suite) {
        const payload = this.extractRequiredForEntityCompletion(suite);
        this.feed(this.updateSuite, payload);
    }

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    addTest(test) {
        const payload = this.extractRegistrationPayloadForTestEntity(test);
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
        const payload = this.extractRequiredForEntityCompletion(test);
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

    /**
     *
     * @param {TestStats} test
     * meta data related to the test case that will be now executed
     */
    onTestPass(test) {
        this.markTestCompletion(test);
    }

    onTestSkip(test) {
        // skipped tests are not registered
        this.addTest(test);
        this.markTestCompletion(test);
    }

    /**
     *
     * @param {RunnerStats} runner
     * info regarding the session, it is required for updating the registered session
     */
    onRunnerEnd(runner) {
        const payload = extractSessionDetailsForCompletion(runner);
        payload.passed = this.counts.passes;
        payload.failed = this.counts.failures;
        payload.skipped = this.counts.skipping;
        payload.hooks = this.counts.hooks;
        payload.tests = this.counts.tests;

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
 * @typedef {object} RegisterSession
 * @property {string} title
 * @property {string} fullTitle
 * @property {string} description
 * @property {string} suiteID
 */

/**
 * @typedef {"PENDING" | "PASSED" | "FAILED"} standing
 * @typedef {{message: string, stack?:string, name: string}} Error
 */

/**
 * @typedef {object} CommonRegisterCols
 * @property {string} started start date-time of the session
 * @property {number} retried number of times this test case has been retried
 * @property {standing} standing status of the execution
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
