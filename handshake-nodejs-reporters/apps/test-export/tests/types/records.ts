export interface TestRun {
	testID: string;
	projectName: string;
	started: string;
	ended: string;
	passed: number;
	failed: number;
	skipped: number;
	tests: number;
	suiteSummary: string;
	duration: number;
	standing: "PASSED" | "FAILED";
}
