import { type Dayjs } from 'dayjs';
import type duration from 'dayjs/plugin/duration';
import type { RecurringFields, statusOfEntity } from './sessionRecords';

export type suiteType = 'SUITE' | 'TEST';

export default interface BasicDetails {
    Started: [Dayjs, Dayjs];
    Ended: [Dayjs, Dayjs];
    Status: statusOfEntity;
    Title: string;
    Duration: duration.Duration;
    Rate: [number, number, number];
}

export interface SuiteRecordDetails extends RecurringFields {
    suiteID: string;
    session_id: string;
    description: string;
    file: string;
    parent: string;
    suiteType: suiteType;
    error: string;
    errors: string;
    title: string;
    tags: string;
}

export interface Tag {
    name: string;
    id: string;
    location: { line: number; column: number };
    astNodeId: string;
}

export interface AttachmentContent {
    title: string;
    value: string;
}

export interface Attachment {
    attachmentValue: string;
    type: string;
    description: string;
    entity_id: string;
}