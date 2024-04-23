import type { ImageRecord, SuiteRecordDetails } from './test-entity-related';
import type TestRunRecord from './test-run-records';
import type { TestRunConfig } from './test-run-records';

export interface SessionSummary {
    entityName: string;
    entityVersion: string;
    tests: number;
}

export interface OverallAggResults {
    parentSuites: number;
    files: number;
    sessionCount: number;
    isRecent: boolean;
    imageCount: number;
    brokenTests: number;
}

export interface OverviewPageProperties {
    detailsOfTestRun: TestRunRecord;
    summaryForAllSessions: SessionSummary[];
    randomImages: ImageRecord[];
    testRunConfig: TestRunConfig;
    relatedRuns: TestRunRecord[];
    recentSuites: SuiteRecordDetails[];
    recentTests: SuiteRecordDetails[];
    aggResults: OverallAggResults;
}
