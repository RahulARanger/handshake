import type { Dayjs } from 'dayjs';
import type { statusOfEntity } from 'src/types/session-records';
import type { Duration } from 'dayjs/plugin/duration';

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
