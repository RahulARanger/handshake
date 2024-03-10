import { TEXT, LOCATORS } from "handshake-utils";
import connection from "../dbInstance.ts";
import dayjs from "dayjs";
import { TestRun } from "../types/records.ts";
import { expect } from "@wdio/globals";

export class RunsPageLocators {
	get latestRun() {
		return $(`#${LOCATORS.RUNS.latestRun}`);
	}

	get latestRunCount() {
		return $(`#${LOCATORS.RUNS.latestRun}-count`);
	}

	get rateChart() {
		return `div.${LOCATORS.CHARTS.rate}`;
	}

	get switchButton() {
		return "button.switch";
	}

	runCard(testID: string) {
		return $(`li[id='${testID}']`);
	}

	get timeRange() {
		return ".time-range";
	}

	get duration() {
		return ".duration";
	}

	get tooltip() {
		return $("div[role='tooltip']");
	}

	get applicationName() {
		return $("#appName");
	}

	get runsRoute() {
		return $("#runs-route");
	}

	get projectNameDropdown() {
		return $(`#${LOCATORS.RUNS.projectNameDropdown}`);
	}

	get dateRangePicker() {
		return $(`#${LOCATORS.RUNS.dateRangeSelector}`);
	}

	get githubRepo() {
		return $(`#${LOCATORS.RUNS.githubURL}`);
	}

	get testRunsCard() {
		return $(`#${LOCATORS.RUNS.testRunsCard}`);
	}

	get testRunsSwitch() {
		return $(`#${LOCATORS.RUNS.testRunsSwitch}`);
	}
}

export class RunsPage extends RunsPageLocators {
	async verifyPage() {
		await expect(browser).toHaveTitle(TEXT.RUNS.greet);
		await this.applicationName.waitForDisplayed();
		await expect(this.projectNameDropdown.parentElement()).toBeDisplayed();
		await expect(this.dateRangePicker.parentElement()).toBeDisplayed();
	}

	async latestTestRun() {
		// where ended <> ''
		// we have not added that condition to verify if the latest run worked
		expect(connection).not.toBeUndefined();
		const testRun = await connection.get<TestRun>(
			"SELECT * FROM runbase order by started desc LIMIT 1"
		);
		expect(testRun).not.toBeUndefined();
		return testRun as TestRun;
	}

	async totalRuns() {
		const result = await connection.get<{ totalRuns: number }>(
			"SELECT COUNT(*) as totalRuns from runbase where ended <> ''"
		);
		return result?.totalRuns ?? 0;
	}

	async verifyLatestTestRun() {
		const testRun = await this.latestTestRun();

		await expect(this.latestRun).toHaveText("Latest Run");
		await expect(this.latestRunCount).toHaveText("(1)");
		await this.verifyTheRun(testRun);
	}

	async verifyTheRun(testRun: TestRun) {
		const link = await $(`#${LOCATORS.RUNS.testRunName}${testRun.testID}`);
		await expect(
			(await (await link.parentElement()).parentElement()).$(
				`.${LOCATORS.RUNS.statusForTestEntity}`
			)
		).toHaveText(testRun.standing === "PASSED" ? "✅" : "❌");
		await expect(link).toHaveText(
			`${dayjs(testRun.started).format(TEXT.dateFormatUsed)}`
		);
	}

	async verifyTheRunCard(testRun: TestRun) {
		await this.verifyTheRun(testRun);
		// assuming the collapse component associated with it, is opened
		const runCard = await this.runCard(testRun.testID);
		await expect(runCard).toBeDisplayed();

		const summary = JSON.parse(testRun.suiteSummary);

		const switchComp = await $(this.switchButton);
		await expect(switchComp).toHaveText("Suites");
		await expect(runCard.$(this.rateChart)).toHaveAttribute(
			"class",
			expect.stringContaining(
				`${summary.passed}-${summary.failed}-${summary.skipped}`
			)
		);

		await switchComp.click();
		await expect(switchComp).toHaveText("Tests");
		await expect(runCard.$(this.rateChart)).toHaveAttribute(
			"class",
			expect.stringContaining(
				`${testRun.passed}-${testRun.failed}-${testRun.skipped}`
			)
		);
	}

	async verifyTheDetailsInRunCard(testRun: TestRun) {
		const runCard = await this.runCard(testRun.testID);
		await expect(runCard).toBeDisplayed();

		await expect(runCard.$(this.timeRange)).toBeDisplayed();
		const durationText = await runCard.$(this.duration);
		await expect(durationText).toBeDisplayed();
		await durationText.click();
		await expect(this.tooltip).toHaveText(TEXT.RUNS.noteForTime);

		await expect(runCard.$(`.${LOCATORS.DAYS.duration}`)).toHaveText(
			`${testRun.duration / 1e3} s`
		);
		await expect(runCard.$(`.${LOCATORS.DAYS.relativeToRange}`)).toHaveText(
			`${dayjs(testRun.started).format(TEXT.timeFormatUsed)} - ${dayjs(testRun.ended).format(TEXT.timeFormatUsed)}`
		);
	}

	async openTestRun(testRun: TestRun) {
		const link = await $(`#${LOCATORS.RUNS.testRunName}${testRun.testID}`);
		await expect(link).toBeDisplayed();
		await link.click();
	}
}

export default new RunsPage();
