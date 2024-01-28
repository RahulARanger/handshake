import sqlite3 from "sqlite3";
import { open } from "sqlite";

import dayjs from "dayjs";
// https://github.com/iamkun/dayjs/issues/1167#issuecomment-972880586
import duration from "dayjs/plugin/duration.js";
import advancedFormat from "dayjs/plugin/advancedFormat.js";

dayjs.extend(duration);
dayjs.extend(advancedFormat);

async function getConnection() {
	return await open({
		filename: "../../../TestResults/TeStReSuLtS.db", // hard-coded for testing purposes
		driver: sqlite3.Database,
	});
}

const connection = await getConnection();
export default connection;
