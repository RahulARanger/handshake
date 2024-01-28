import { Given, Then, When } from "@wdio/cucumber-framework";
import { url } from "../constants.ts";
import runsPage from "../pages/runs.page.ts";
import { TEXT } from "handshake-utils";

Given("User is in the runs page", async () => {
	await browser.url(`${url}/RUNS/`);
	await runsPage.verifyPage();
});

Then("User must be able to see the latest Test run", async () => {
	await runsPage.verifyLatestTestRun();
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

Then("User can see the Application name and Total test runs", async () => {
	await expect(runsPage.applicationName).toHaveText(TEXT.applicationName);
	await expect(runsPage.runsRoute).toHaveText(
		`Runs (${await runsPage.totalRuns()})`
	);
});

Then("User can see Filter components", async () => {
	await expect(runsPage.projectNameDropdown).toExist();
	await expect(runsPage.dateRangePicker).toBeDisplayed();
});

Then("the url for our repo.", async () => {
	await expect(runsPage.githubRepo).toHaveAttr("href", TEXT.REPO);
});

Then("User can see the area chart for all the test runs", async () => {
	await expect(runsPage.testRunsCard).toBeDisplayed();
	await expect(runsPage.testRunsSwitch).toHaveText("Tests");
	await expect((await runsPage.testRunsCard).$("canvas")).toBeDisplayed();
});

When("User redirects to the latest test run", async () => {
	await runsPage.openTestRun(await runsPage.latestTestRun());
});
