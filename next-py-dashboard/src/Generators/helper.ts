import dayjs from "dayjs";
import ParseFormat from "dayjs/plugin/customParseFormat";
import Relatively from "dayjs/plugin/relativeTime";

dayjs.extend(ParseFormat);
dayjs.extend(Relatively);

let port: undefined | string;

if (process?.env != null) {
    port = process.env?.PY_PORT;
}

export default function readDateForKey(date: string): dayjs.Dayjs {
    return dayjs(date);
}

export function fromNow(date: dayjs.Dayjs): string {
    return date.fromNow();
}

export function serverURL(): string {
    return `http://127.0.0.1:${port ?? "1.2"}`;
}

export function getTestRun(testID: string): string {
    return `${serverURL()}/get/run?test_id=${testID}`;
}

export function getSuites(testID: string): string {
    return `${serverURL()}/get/suites?test_id=${testID}`;
}

export function getTestRunSummary(testID: string): string {
    return `${serverURL()}/get/test-run-summary?test_id=${testID}`;
}

export async function fetcher<T>(url: string): Promise<T> {
    return await fetch(url).then(async (resp) => await resp.json());
}
