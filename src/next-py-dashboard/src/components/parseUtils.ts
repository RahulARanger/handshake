import { type SuiteDetails } from "@/types/detailedTestRunPage";
import dayjs, { type Dayjs } from "dayjs";

export interface QuickPreviewForScenarios {
    Started: [string, Dayjs];
    Ended: [string, Dayjs | string];
    Status: "PASSED" | "FAILED" | "PENDING";
    Title: string;
    FullTitle: string;
}

export default function parseTestEntity(
    testORSuite: SuiteDetails,
    testStartedAt: Dayjs
): QuickPreviewForScenarios {
    return {
        Started: [
            dayjs(testORSuite.started).from(testStartedAt),
            dayjs(testORSuite.started),
        ],
        Ended: [
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            testORSuite.ended && dayjs(testORSuite.ended).from(testStartedAt),
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            testORSuite.ended && dayjs(testORSuite.ended),
        ],
        Status: testORSuite.standing,
        Title: testORSuite.title,
        FullTitle: testORSuite.fullTitle,
    };
}

export function formatDateTime(dateTime: Dayjs): string {
    return dateTime?.format("MMM DD, YYYY hh:mm A") ?? "Not Specified";
}
