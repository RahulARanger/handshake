import { type RecurringFields } from './detailedTestRunPage'
import { type possibleBrowserNames } from './testEntityRelated'

export default interface SessionRecordDetails extends RecurringFields {
    sessionID: string
    browserVersion: string
    browserName: possibleBrowserNames
    simplified: string
    specs: string[]
    hooks: number
    test_id: string
}
