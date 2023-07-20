interface TestResult {
    name: string;
    description: string;
    passed: number;
    failed: number;
    skipped: number;
}

type TestResults = Record<string, TestResult>;
export default TestResults;

export interface SWRResponse<Details> {
    data?: Details;
    error?: string;
    isLoading: boolean;
}

export interface FeatureResult extends TestResult {
    vars: Record<string, string>;
}

export interface DetailedTestResult extends TestResult {
    version: string;
    started: string;
    finished: string;
    features: Record<string, FeatureResult>;
    vars: Record<string, number | string | boolean>;
}
