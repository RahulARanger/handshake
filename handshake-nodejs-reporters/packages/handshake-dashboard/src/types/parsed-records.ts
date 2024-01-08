import type { Dayjs } from 'dayjs';
import type { statusOfEntity } from 'src/types/session-records';
import type { Duration } from 'dayjs/plugin/duration';
import type { SimpleSuiteDetails } from './test-entity-related';

export default interface BasicDetails {
    Started: [Dayjs, Dayjs];
    Ended: [Dayjs, Dayjs];
    Status: statusOfEntity;
    Title: string;
    Duration: Duration;
    Rate: [number, number, number];
    Id: string;
}

export interface DetailedTestRecord extends BasicDetails {
    SuitesSummary: [number, number, number];
    Tests: number;
    Suites: number;
    Link: string;
    projectName: string;
}

export interface ParsedSuiteRecord extends BasicDetails, SimpleSuiteDetails {
    errors: string[];
    RollupValues: [number, number, number];
    totalRollupValue: number;
}

export type SuiteDetails = { '@order': string[] } & Record<
    string,
    ParsedSuiteRecord
>;
