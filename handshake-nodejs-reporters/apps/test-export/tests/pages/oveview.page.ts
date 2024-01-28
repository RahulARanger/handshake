import { TEXT } from "handshake-utils";
import { RunsPage } from "./runs.page.ts";
import { LOCATORS } from "handshake-utils";
import { TestRun } from "../types/records.ts";
import dayjs from "dayjs";

class OverViewPageLocators extends RunsPage {
	get projectName() {
		return $("#projectName");
	}
	get header() {
		return $(".header");
	}
}

export class OverViewPage extends OverViewPageLocators {
	async verifyHeader(testRun: TestRun) {
		await expect(this.runsRoute).toHaveText("Runs");
		await expect(this.applicationName).toHaveText(TEXT.applicationName);
		await expect(this.projectName).toHaveText(testRun.projectName);
		await expect(
			(await this.header).$(`.${LOCATORS.DAYS.relativeToRange}`)
		).toHaveText(dayjs(testRun.started).format(TEXT.dateFormatUsed));
	}
}

export default new OverViewPage();
