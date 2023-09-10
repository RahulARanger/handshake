import {
    type statusOfEntity,
    type SuiteRecordDetails,
} from "@/types/detailedTestRunPage";
import dayjs, { type Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

export interface QuickPreviewForScenarios {
    Started: [Dayjs, Dayjs];
    Ended: [Dayjs, Dayjs];
    Status: statusOfEntity;
    Title: string;
    FullTitle: string;
    Duration: duration.Duration;
    Rate: [number, number, number];
    Tests: number;
}

export interface PreviewForDetailedEntities extends QuickPreviewForScenarios {
    File: string;
    Retried: number;
    Description: string;
}

export default function parseTestEntity(
    testORSuite: SuiteRecordDetails,
    testStartedAt: Dayjs
): QuickPreviewForScenarios {
    return {
        Started: [dayjs(testORSuite.started), testStartedAt],
        Ended: [dayjs(testORSuite.ended), testStartedAt],
        Status: testORSuite.standing,
        Title: testORSuite.title,
        FullTitle: testORSuite.fullTitle,
        Duration: dayjs.duration({ milliseconds: testORSuite.duration }),
        Rate: [testORSuite.passed, testORSuite.failed, testORSuite.skipped],
        Tests: testORSuite.tests,
    };
}

export function parseDetailedTestEntity(
    testORSuite: SuiteRecordDetails,
    testStartedAt: Dayjs
): PreviewForDetailedEntities {
    return {
        Started: [dayjs(testORSuite.started), testStartedAt],
        Ended: [dayjs(testORSuite.ended), testStartedAt],
        Status: testORSuite.standing,
        Title: testORSuite.title,
        FullTitle: testORSuite.fullTitle,
        Duration: dayjs.duration({ milliseconds: testORSuite.duration }),
        Rate: [testORSuite.passed, testORSuite.failed, testORSuite.skipped],
        Tests: testORSuite.tests,
        File: testORSuite.file,
        Retried: testORSuite.retried,
        Description: testORSuite.description,
    };
}

export function formatDateTime(dateTime: Dayjs): string {
    return dateTime?.format("MMM DD, YYYY hh:mm A") ?? "Not Specified";
}

export function formatTime(dateTime: Dayjs): string {
    return dateTime?.format("hh:mm:ss A") ?? "Not Specified";
}

export const statusColors = ["green", "#FC4349", "#2C3E50"];
