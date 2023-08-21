import { SuiteDetails } from "@/types/detailedTestRunPage";
import dayjs, { Dayjs } from "dayjs";

export default function parseTestEntity(testORSuite: SuiteDetails, testStartedAt: Dayjs){
    return {
        Started: [dayjs(testORSuite.started).from(testStartedAt), dayjs(testORSuite.started)],
        Ended: [
            testORSuite.ended && dayjs(testORSuite.ended).from(testStartedAt),
             testORSuite.ended && dayjs(testORSuite.ended)
            ],
        Status: testORSuite.standing,
        Title: testORSuite.title,
        FullTitle: testORSuite.fullTitle
    }
}


export function formatDateTime(dateTime: Dayjs){
    return dateTime?.format("MMM DD, YYYY hh:mm A") ?? "Not Specified"
}
