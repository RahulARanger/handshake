import type SessionRecordDetails from './sessionRelated'
import type DetailsOfRun from './testRun'
import { type TestRunSummary } from './testRun'

export interface ShareToOtherPages {
    test_id: string
    port: string
}

export interface DetailedTestRunPageProps extends ShareToOtherPages {
    fallback: Record<
        string,
        | DetailsOfRun
        | TestRunSummary
        | SuiteDetails
        | TestDetails
        | SessionDetails
        | AttachmentDetails
    >
}

export interface OverviewPageProps extends ShareToOtherPages {}

export type statusOfEntity = 'PASSED' | 'FAILED' | 'PENDING' | 'SKIPPED'
export type suiteType = 'SUITE' | 'TEST'

export interface RecurringFields {
    started: string
    ended: string
    passed: number
    failed: number
    skipped: number
    duration: number
    retried: number
    standing: statusOfEntity
    tests: number
}

export interface SuiteRecordDetails extends RecurringFields {
    suiteID: string
    session_id: string
    description: string
    file: string
    parent: string
    suiteType: suiteType
    error: string
    errors: string
    title: string
    tags: string
}

export interface Attachment {
    attachmentValue: string
    type: string
    description: string
    entity_id: string
}

export interface AttachmentContent {
    title: string
    value: string
}
interface Order {
    '@order': string[]
}

export type SuiteDetails = Order & Record<string, SuiteRecordDetails>

export type TestDetails = Record<string, SuiteRecordDetails>

export type SessionDetails = Record<string, SessionRecordDetails>
export type AttachmentDetails = Record<string, Attachment[]>

export const gridViewMode = 'grid'
export const treeViewMode = 'tree'

export const testEntitiesTab = 'test-entities'
export const overviewTab = 'overview'
export const ganttChartTab = 'ganttChart'
