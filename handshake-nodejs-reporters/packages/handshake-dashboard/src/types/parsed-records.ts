import type { Dayjs } from 'dayjs';
import type { statusOfEntity } from 'types/session-records';
import type { Duration } from 'dayjs/plugin/duration';
import type {
    Assertion,
    ErrorRecord,
    ImageRecord,
    SimpleSuiteDetails,
    Tag,
} from './test-entity-related';
import type { possibleFrameworks, specNode } from './test-run-records';

export default interface BasicDetails {
    Started: Dayjs;
    Ended: Dayjs;
    Status: statusOfEntity;
    Title: string;
    Duration: Duration;
    Rate: [number, number, number];
    Id: string;
    Tests: number;
}

export interface DetailedTestRecord extends BasicDetails {
    SuitesSummary: [number, number, number];
    Suites: number;
    Link: string;
    projectName: string;
    specStructure: specNode;
    Frameworks: possibleFrameworks[];
}

export interface ParsedSuiteRecord extends BasicDetails, SimpleSuiteDetails {
    errors: ErrorRecord[];
    error: ErrorRecord;
    testStartedAt: Dayjs;
    RollupValues: [number, number, number];
    totalRollupValue: number;
    Contribution: number;
    File: string;
    entityName: string;
    entityVersion: string;
    simplified: string;
    hooks: number;
    Tags: Tag[];
    _UseFilterForTitle: string;
}

export interface ParsedTestRecord extends BasicDetails, SimpleSuiteDetails {
    isBroken: boolean;
    errors: ErrorRecord[];
    error: ErrorRecord;
    Images: ImageRecord[];
    Assertions: Assertion[];
    _UseFilterForTitle: string;
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
