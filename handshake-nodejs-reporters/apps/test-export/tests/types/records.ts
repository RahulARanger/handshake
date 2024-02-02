export interface TestRun {
	testID: string;
	projectName: string;
	started: string;
	ended: string;
	passed: number;
	failed: number;
	skipped: number;
	suiteSummary: string;
	duration: number;
	standing: "PASSED" | "FAILED";
}
