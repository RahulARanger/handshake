import type Suite from "./testRelated";

type TestResults = Record<string, Suite>;

export default TestResults;

export interface SWRResponse<Details> {
    data?: Details;
    error?: string;
    isLoading: boolean;
}

export interface FeatureResult extends Suite {
    vars: Record<string, string>;
    combined?: [undefined | number, undefined | number, undefined | number];
}

export interface DetailedTestResult extends Suite {
    version: string;
    started: string;
    finished: string;
    features: Record<string, FeatureResult>;
    vars: Record<string, number | string | boolean>;
    attachments: Record<string, Attachment>;
}

interface Attachment {
    type: "PICTURE" | "TEXT" | "JSON";
    attachedTo: string;
}
