export default interface DetailsOfRun {
    projectName: string;
    testID: string;
    standing: string;
    passed: number;
    failed: number;
    skipped: number;
    tests: number;
    duration: number;
    label: string;
    framework: string;
    started: string;
    ended: string;
    retried: number;
    tags: string[];
    suitesConfig: string[];
    specs: string[];
}
