import dayjs from 'dayjs';
import ParseFormat from 'dayjs/plugin/customParseFormat';
import Relatively from 'dayjs/plugin/relativeTime';

dayjs.extend(ParseFormat);
dayjs.extend(Relatively);

export default function readDateForKey(date: string): dayjs.Dayjs {
    return dayjs(date);
}

export function fromNow(date: dayjs.Dayjs): string {
    return date.fromNow();
}

function filler(thing?: string): string {
    return thing ?? 'was-passed-empty';
}

export function serverURL(port?: string): string {
    return `http://127.0.0.1:${filler(port)}`;
}

export function getTestRun(port?: string, testID?: string): string {
    return `${serverURL(port)}/get/run?test_id=${filler(testID)}`;
}

export function getSuites(port?: string, testID?: string): string {
    return `${serverURL(filler(port))}/get/suites?test_id=${filler(testID)}`;
}

export function getTestRunSummary(port?: string, testID?: string): string {
    return `${serverURL(port)}/get/test-run-summary?test_id=${filler(testID)}`;
}

export function getTests(port?: string, testID?: string): string {
    return `${serverURL(port)}/get/tests?test_id=${filler(testID)}`;
}

export function getSessions(port?: string, testID?: string): string {
    return `${serverURL(port)}/get/sessions?test_id=${filler(testID)}`;
}

export function getEntityLevelAttachment(
    port?: string,
    testID?: string,
): string {
    return `${serverURL(port)}/get/allEntityLevelAttachments?test_id=${filler(
        testID,
    )}`;
}

export function getTestRunConfig(port?: string, testID?: string): string {
    return `${serverURL(port)}/get/testRunConfig?test_id=${filler(testID)}`;
}

export async function fetcher<T>(url: string): Promise<T> {
    return await fetch(url).then(async (resp) => await resp.json());
}
