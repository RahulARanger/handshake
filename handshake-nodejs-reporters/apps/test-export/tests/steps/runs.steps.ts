import { Given } from "@wdio/cucumber-framework";
import { url } from "../constants.ts";

Given("I am in the runs page", async () => {
	await browser.url(`${url}/RUNS/`);
});
