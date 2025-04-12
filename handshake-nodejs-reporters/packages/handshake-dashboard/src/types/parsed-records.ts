import type { Dayjs } from 'dayjs';
import type {
    possibleEntityNames,
    RunStatus,
    statusOfEntity,
} from 'types/session-records';
import type { Duration } from 'dayjs/plugin/duration';
import type {
    // Assertion,
    ErrorRecord,
    // ImageRecord,
    SimpleSuiteDetails,
    Tag,
} from './test-entity-related';
import type { possibleFrameworks, specStructure } from './test-run-records';

export default interface BasicDetails {
    Started: Dayjs;
    Ended: Dayjs;
    Status: statusOfEntity;
    Title: string;
    Duration: Duration;
    Rate: [number, number, number, number, number]; // passed, failed, skipped, xfailed, xpassed
    Id: string;
    Tests: number;
}

export interface DetailedTestRecord extends BasicDetails {
    SuitesSummary: [number, number, number, number, number]; // passed, failed, skipped, xfailed, xpassed
    Suites: number;
    Link: string;
    projectName: string;
    specStructure: specStructure;
    Frameworks: possibleFrameworks[];
    timelineIndex: number;
    projectIndex: number;
    Bail: number;
    FileRetries: number;
    ExitCode: number;
    MaxInstances: number;
    Platform: string;
    Tags: Tag[];
    RunStatus: RunStatus;
    ExcelExportUrl?: string;
}

export interface ParsedSuiteRecord extends BasicDetails, SimpleSuiteDetails {
    RollupValues: [number, number, number];
    Contribution: number;
    File: string;
    entityName: possibleEntityNames;
    entityVersion: string;
    simplified: string;
    hooks: number;
    Tags: Tag[];
    PrevSuite?: string;
    NextSuite?: string;
    hasChildSuite: boolean;
}

export interface ParsedTestRecord extends BasicDetails, SimpleSuiteDetails {
    // isBroken: boolean;
    errors: ErrorRecord[];
    error?: ErrorRecord;
    Tags: Tag[];
    numberOfAssertions: number;
    hasExpanded?: boolean;
    // Images: ImageRecord[];
    // Assertions: Assertion[];
    // _UseFilterForTitle: string;
}

export type SuiteDetails = { '@order': string[] } & Record<
    string,
    ParsedSuiteRecord
>;

export type TestDetails = Record<string, ParsedTestRecord>;

interface ParsedRetriedRecord {
    suite_id: string;
    test: string;
    tests: string[];
    key: number;
    length: number;
}

export type ParsedRetriedRecords = Record<string, ParsedRetriedRecord>;

export type ParsedEntities = ParsedTestRecord | ParsedSuiteRecord;
