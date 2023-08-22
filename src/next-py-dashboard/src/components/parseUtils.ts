import { type SuiteDetails } from "@/types/detailedTestRunPage";
import dayjs, { type Dayjs } from "dayjs";

export interface QuickPreviewForScenarios {
    Started: [Dayjs, Dayjs];
    Ended: [Dayjs, Dayjs];
    Status: "PASSED" | "FAILED" | "PENDING";
    Title: string;
    FullTitle: string;
}

export default function parseTestEntity(
    testORSuite: SuiteDetails,
    testStartedAt: Dayjs
): QuickPreviewForScenarios {
    return {
        Started: [dayjs(testORSuite.started), testStartedAt],
        Ended: [dayjs(testORSuite.ended), testStartedAt],
        Status: testORSuite.standing,
        Title: testORSuite.title,
        FullTitle: testORSuite.fullTitle,
    };
}

export function formatDateTime(dateTime: Dayjs): string {
    return dateTime?.format("MMM DD, YYYY hh:mm A") ?? "Not Specified";
}
