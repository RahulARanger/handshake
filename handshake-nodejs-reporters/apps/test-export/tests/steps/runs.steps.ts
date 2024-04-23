import { Given, Then, When } from "@wdio/cucumber-framework";
import { url } from "../constants.ts";
import runsPage from "../pages/runs.page.ts";
import { TEXT } from "handshake-utils";
import connection from "../dbInstance.ts";

Given("User is in the runs page", async () => {
	await browser.url(`${url}/RUNS/`);
	await runsPage.verifyPage();
});

Then("User would see the results for the {int} test runs", async (runs) => {
	await expect(runsPage.runsRoute).toHaveText(`Runs (${runs})`);
});

Then("User must be able to see the latest Test run", async () => {
	await runsPage.verifyLatestTestRun();
});

Then("all the test of the latest Test run must be passed", async () => {
	const run = await runsPage.latestTestRun();
	expect(run.passed).toBe(run.tests);
	expect(run.failed).toBe(0);
	expect(run.skipped).toBe(0);

	const suiteSummary = JSON.parse(run.suiteSummary);
	expect(suiteSummary.passed).toBe(suiteSummary.count);
	expect(suiteSummary.failed).toBe(0);
	expect(suiteSummary.skipped).toBe(0);
});

Then("all the runs are in the processed state", async () => {
	await expect(
		await connection.all(
			"SELECT * FROM RUNBASE WHERE standing = 'YET_TO_CALC'"
		)
	).toHaveLength(0);
});

Then("User would see no errors in the testlogbase table", async () => {
	await expect(
		await connection.all(
			"select type from testlogbase where type = 'ERROR'"
		)
	).toHaveLength(0);
});

Then(
	"User would be able verify the functionality of the switch in the run card",
	async () => {
		await runsPage.verifyTheRunCard(await runsPage.latestTestRun());
	}
);

Then(
	"User would be able to see the duration and range of the test run",
	async () => {
		await runsPage.verifyTheDetailsInRunCard(
			await runsPage.latestTestRun()
		);
	}
);

Then("User can see the Application name", async () => {
	await expect(runsPage.applicationName).toHaveText(TEXT.applicationName);
});

Then("User can see Filter components", async () => {
	await expect(runsPage.projectNameDropdown).toExist();
	await expect(runsPage.dateRangePicker).toBeDisplayed();
});

Then("the about button for handshake", async () => {
	await runsPage.aboutModal.click();
	await runsPage.handshakeHeader.waitForDisplayed();
	await expect(runsPage.handshakeHeader).toHaveText("Handshake 🫱🏾‍🫲🏼");
	await expect(runsPage.resourcesHeader).toHaveText("Resources");
});

Then("User can see the area chart for all the test runs", async () => {
	await expect(runsPage.testRunsCard).toBeDisplayed();
	await expect(runsPage.testRunsSwitch).toHaveText("Tests");
	await expect((await runsPage.testRunsCard).$("canvas")).toBeDisplayed();
});

When("User redirects to the latest test run", async () => {
	await runsPage.openTestRun(await runsPage.latestTestRun());
});
