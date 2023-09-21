import { type RecurringFields } from "./detailedTestRunPage";

export default interface SessionRecordDetails extends RecurringFields {
    sessionID: string;
    browserVersion: string;
    browserName: string;
    simplified: string;
    specs: string[];
    hooks: number;
    test_id: string;
}
