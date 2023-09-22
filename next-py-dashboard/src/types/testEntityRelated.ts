import { type Dayjs } from "dayjs";
import type duration from "dayjs/plugin/duration";
import { type statusOfEntity } from "@/types/detailedTestRunPage";

interface BasicDetails {
    Started: [Dayjs, Dayjs];
    Ended: [Dayjs, Dayjs];
    Status: statusOfEntity;
    Title: string;
    Duration: duration.Duration;
    Rate: [number, number, number];
}

export interface QuickPreviewForTestRun extends BasicDetails {
    SuitesSummary: [number, number, number];
    Tests: number;
    Suites: number;
    Link: string;
}

export interface QuickPreviewForScenarios extends BasicDetails {
    Tests: number;
}

export interface PreviewForTests extends BasicDetails {
    Description: string;
    id: string;
    Error: Error;
}

export interface PreviewForDetailedEntities extends QuickPreviewForScenarios {
    File: string;
    Retried: number;
    Description: string;
    id: string;
    browserName: string;
    browserVersion: string;
}

// please note, following browsers were added based on the browsers supported by webdriverIO
// we would add the names based on the request / requirement
export type possibleBrowserNames =
    | "chrome"
    | "firefox"
    | "safari"
    | "edge"
    | "others";
