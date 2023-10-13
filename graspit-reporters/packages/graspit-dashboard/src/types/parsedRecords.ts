import type BasicDetails from './testEntityRelated';
import type { suiteType } from './testEntityRelated';

// getStaticPaths to [id] root page
export interface ShareToOtherPages {
    test_id: string;
    port: string;
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

export interface PreviewForTests extends BasicDetails {
    Description: string;
    id: string;
    Errors: Error[];
    type: suiteType;
}

export interface PreviewForDetailedEntities extends QuickPreviewForScenarios {
    File: string;
    Retried: number;
    Description: string;
    id: string;
    entityName: string;
    entityVersion: string;
}
