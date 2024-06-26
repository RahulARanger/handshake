import type dayjs from 'dayjs';
import type { Duration } from 'dayjs/plugin/duration';
import type { ImageRecord, suiteType } from './test-entity-related';
import type { DetailedTestRecord } from './parsed-records';
import type { OverallAggResults, SessionSummary } from './records-in-overview';
import { createContext } from 'react';
import type { statusOfEntity } from './session-records';

export interface ResultOfEntity {
    passed: number;
    failed: number;
    skipped: number;
}

export interface OverviewOfEntities extends ResultOfEntity {
    started: dayjs.Dayjs;
    ended: dayjs.Dayjs;
    duration: Duration;
    title: string;
    id: string;
    type: suiteType;
    standing: statusOfEntity;
}

export interface ValuesInOverviewContext {
    detailsOfTestRun: DetailedTestRecord;
    summaryForAllSessions: SessionSummary[];
    randomImages: ImageRecord[];
    recentSuites: OverviewOfEntities[];
    recentTests: OverviewOfEntities[];
    aggResults: OverallAggResults;
    relatedRuns: DetailedTestRecord[];
}

export const OverviewContext = createContext<
    ValuesInOverviewContext | undefined
>(undefined);
