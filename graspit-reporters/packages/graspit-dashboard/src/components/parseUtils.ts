import { runPage } from 'src/components/scripts/helper';
import type {
    Attachment,
    SuiteRecordDetails,
} from 'src/types/testEntityRelated';
import type {
    QuickPreviewForScenarios,
    QuickPreviewForTestRun,
    PreviewForDetailedEntities,
    PreviewForTests,
    QuickPreviewForAttachments,
} from 'src/types/parsedRecords';
import type TestRunRecord from 'src/types/testRunRecords';
import type SessionRecordDetails from 'src/types/sessionRecords';
import dayjs, { type Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import {
    greenGradient,
    redGradient,
    skippedGradient,
} from './charts/constants';
import type { statusOfEntity } from 'src/types/sessionRecords';
import type { BadgeProps } from 'antd';
import type { TimelineItemProps } from 'antd/lib';

dayjs.extend(duration);

export default function parseTestEntity(
    testORSuite: SuiteRecordDetails,
    testStartedAt: Dayjs,
): QuickPreviewForScenarios {
    return {
        Started: [dayjs(testORSuite.started), testStartedAt],
        Ended: [dayjs(testORSuite.ended), testStartedAt],
        Status: testORSuite.standing,
        Title: testORSuite.title,
        Duration: dayjs.duration({ milliseconds: testORSuite.duration }),
        Rate: [testORSuite.passed, testORSuite.failed, testORSuite.skipped],
        Tests: testORSuite.tests,
    };
}

export function parseDetailedTestEntity(
    testORSuite: SuiteRecordDetails,
    testStartedAt: Dayjs,
    session: SessionRecordDetails,
): PreviewForDetailedEntities {
    return {
        Started: [dayjs(testORSuite.started), testStartedAt],
        Ended: [dayjs(testORSuite.ended), testStartedAt],
        Status: testORSuite.standing,
        Title: testORSuite.title,
        Duration: dayjs.duration({ milliseconds: testORSuite.duration }),
        Rate: [
            testORSuite.rollup_passed ?? 0,
            testORSuite.rollup_failed ?? 0,
            testORSuite.rollup_skipped ?? 0,
        ],
        Tests: testORSuite.tests,
        File: testORSuite.file,
        Retried: testORSuite.retried,
        Description: testORSuite.description,
        id: testORSuite.suiteID,
        entityName: session.entityName,
        entityVersion: session.entityVersion,
    };
}

export function parseTestCaseEntity(
    testORSuite: SuiteRecordDetails,
    testStartedAt: Dayjs,
): PreviewForTests {
    return {
        Started: [dayjs(testORSuite.started), testStartedAt],
        Ended: [dayjs(testORSuite.ended), testStartedAt],
        Status: testORSuite.standing,
        Title: testORSuite.title,
        Duration: dayjs.duration({ milliseconds: testORSuite.duration }),
        Rate: [testORSuite.passed, testORSuite.failed, testORSuite.skipped],
        Errors: JSON.parse(testORSuite.errors),
        Description: testORSuite.description,
        id: testORSuite.suiteID,
        type: testORSuite.suiteType,
    };
}

export function parseDetailedTestRun(
    testRun: TestRunRecord,
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
        Link: runPage(testRun.testID),
    };
}

export function parseAttachment(
    attached: Attachment,
): QuickPreviewForAttachments {
    return {
        ...attached,
        parsed: JSON.parse(attached.attachmentValue),
    };
}

export function convertForWrittenAttachments(
    prefix: string,
    testID: string,
    attachmentID: string,
): string {
    return [prefix, testID, attachmentID].join('/');
}

export const statusColors = [greenGradient, redGradient, skippedGradient];

export function badgeStatus(status: string): BadgeProps['status'] {
    switch (status as statusOfEntity) {
        case 'FAILED':
            return 'error';
        case 'PASSED':
            return 'success';
        case 'PENDING':
            return 'processing';
        case 'SKIPPED':
            return 'warning';
    }
}

export function timelineColor(status: string): TimelineItemProps['color'] {
    switch (status as statusOfEntity) {
        case 'FAILED':
            return 'red';
        case 'PASSED':
            return 'green';
        case 'PENDING':
            return 'blue';
        case 'SKIPPED':
            return 'gray';
    }
}

export const optionsForEntities = ['Timeline'];
