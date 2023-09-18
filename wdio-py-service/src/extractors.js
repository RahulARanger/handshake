import { RunnerStats, SuiteStats, TestStats } from '@wdio/reporter';
import { relative } from 'node:path';

/**
 * chopped sensitive paths from the absolute paths provided
 * @param {string[]} specs list of spec files used
 * @returns {string[]} sanitized paths
 */
export function sanitizePaths(specs) {
    return (specs ?? [])
        .map(
            (spec) => relative(process.cwd(), spec.startsWith('file:///') ? decodeURI(spec.slice(8)) : spec),
        );
}

/**
 * Extracting the Required information for registering a session
 * @param {RunnerStats} runnerStats stats attached to a runner
 * @returns {RegisterSessionPayload} payload for registering a session
 */
export default function extractSessionDetailsForRegistration(runnerStats) {
    return {
        started: runnerStats.start.toISOString(),
        sessionID: runnerStats.sessionId,
        browserName: runnerStats.capabilities.browserName,
        browserVersion: runnerStats.capabilities.browserVersion,
        specs: sanitizePaths(runnerStats.specs),
        simplified: runnerStats.sanitizedCapabilities,
        retried: runnerStats.retry,
    };
}

/**
 * Extracting the Required information for registering a session
 * @param {RunnerStats} runnerStats stats attached to a runner
 * @returns {CompletionSessionPayload} payload for updating the session status
 */
export function extractSessionDetailsForCompletion(
    runnerStats,
) {
    return {
        ended: runnerStats?.end?.toISOString() ?? new Date().toISOString(),
        duration: runnerStats.duration,
        sessionID: runnerStats.sessionId,
    };
}

/**
 * generate the suite id from the start date and its uid
 * @param {SuiteStats | TestStats} suiteOrTest suite or test for which we would need its id
 * @returns {string} id generated for the requested entity
 */
export function returnSuiteID(suiteOrTest) {
    return `${suiteOrTest.start.toISOString()}-${suiteOrTest.uid}`;
}

/**
 * @typedef {object} RegisterSessionPayload
 * @property {string} started ISO String of session's start date-time
 * @property {string} sessionID uuid attached to the session
 * @property {string} browserName name of the browser used
 * @property {string} browserVersion version of the browser attached
 * @property {string[]} specs list of spec files
 * @property {string} sanitizedCapabilities summary of the capability used
 * @property {number} retried number of retries this session was attempted before this session
 */

/**
 * @typedef {object} CompletionSessionPayload
 * @property {string} ended ISO String of session's end date-time
 * @property {string} sessionID uuid attached to the session
 * @property {number} duration session length (in milliseconds)
 * @property {number} passed number of test case passed
 * @property {number} skipped number of test case skipped
 * @property {number} failed number of test case failed
 * @property {number} hooks number of hooks used
 */
