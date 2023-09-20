import runLink from "@/Generators/linkProviders";
import {
    type statusOfEntity,
    type SuiteRecordDetails,
} from "@/types/detailedTestRunPage";
import type DetailsOfRun from "@/types/testRun";
import dayjs, { type Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

interface BasicDetails {
    Started: [Dayjs, Dayjs];
    Ended: [Dayjs, Dayjs];
    Status: statusOfEntity;
    Title: string;
    Duration: duration.Duration;
    Rate: [number, number, number];
    Tests: number;
}

export interface QuickPreviewForTestRun extends BasicDetails {
    SuitesSummary: [number, number, number];
    Suites: number;
    Link: string;
}

export interface QuickPreviewForScenarios extends BasicDetails {
    FullTitle: string;
}

export interface PreviewForDetailedEntities extends QuickPreviewForScenarios {
    File: string;
    Retried: number;
    Description: string;
    id: string;
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
        id: testORSuite.suiteID,
    };
}

export function parseDetailedTestRun(
    testRun: DetailsOfRun
): QuickPreviewForTestRun {
    const summary: {
        passed: number;
        failed: number;
        count: number;
        skipped: number;
    } = JSON.parse(testRun.suiteSummary);
    return {
        Started: [dayjs(testRun.started), dayjs()],
        Ended: [dayjs(testRun.ended), dayjs()],
        Title: testRun.projectName,
        Status: testRun.standing,
        Rate: [testRun.passed, testRun.failed, testRun.skipped],
        Duration: dayjs.duration({ milliseconds: testRun.duration }),
        Tests: testRun.tests,
        SuitesSummary: [summary.passed, summary.failed, summary.skipped],
        Suites: summary.count,
        Link: runLink(testRun.testID),
    };
}

export function formatDateTime(dateTime: Dayjs): string {
    return dateTime?.format("MMM DD, YYYY hh:mm A") ?? "Not Specified";
}

export function formatTime(dateTime: Dayjs): string {
    return dateTime?.format("hh:mm:ss A") ?? "Not Specified";
}

export const statusColors = ["green", "#FC4349", "#2C3E50"];
