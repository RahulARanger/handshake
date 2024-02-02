import { Then } from "@wdio/cucumber-framework";
import overviewPage from "../pages/oveview.page.ts";

Then("User would be in the overview page of the test run", async () => {
	await overviewPage.verifyHeader(await overviewPage.latestTestRun());
});

Then("User would see the total tests", async () => {});
