import type BasicDetails from './testEntityRelated';
import type { Attachment, suiteType } from './testEntityRelated';

// getStaticPaths to [id] root page
export interface ShareToOtherPages {
    testID?: string;
    port?: string;
    attachmentPrefix?: string;
}

export interface QuickPreviewForTestRun extends BasicDetails {
    SuitesSummary: [number, number, number];
    Tests: number;
    Suites: number;
    Link: string;
}

// used for showing preview for the scenarios (without much details)
export interface QuickPreviewForScenarios extends BasicDetails {
    Tests: number;
}

export interface AttachedError extends Error {
    mailedFrom: string[];
}

export interface Assertion {
    matcherName: string;
    result: { pass: boolean };
    expectedValue: string;
}

export interface PreviewForTests extends BasicDetails {
    Description: string;
    id: string;
    Errors: AttachedError[];
    type: suiteType;
    Parent: string;
}

export interface PreviewForDetailedEntities extends QuickPreviewForScenarios {
    File: string;
    Retried: number;
    Description: string;
    id: string;
    entityName: string;
    entityVersion: string;
}

export interface QuickPreviewForAttachments extends Attachment {
    parsed: { title: string; value: string };
}
