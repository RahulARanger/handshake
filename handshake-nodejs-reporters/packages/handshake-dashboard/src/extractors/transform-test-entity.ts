import dayjs from 'dayjs';
import type { ParsedSuiteRecord } from 'types/parsed-records';
import type { SuiteRecordDetails } from 'types/test-entity-related';
import Convert from 'ansi-to-html';

export default function transformTestEntity(
    testEntity: SuiteRecordDetails,
    totalTestsInATestRun: number,
    convert: Convert,
): ParsedSuiteRecord {
    const errors = testEntity.errors.map((error) => {
        error.message = convert.toHtml(error.message).trim();
        error.stack = convert.toHtml(error.stack).trim();
        return error;
    });
    return {
        Started: dayjs(testEntity.started),
        Ended: dayjs(testEntity.ended),
        Title: testEntity.title.trim(),
        Desc: testEntity.description.trim(),
        Id: testEntity.suiteID,
        Status: testEntity.standing,
        Rate: [testEntity.passed, testEntity.failed, testEntity.skipped],
        Duration: dayjs.duration({ milliseconds: testEntity.duration }),
        Tests: testEntity.tests,
        File: testEntity.file,
        // Link: testRunPage(testEntity.testID),
        errors,
        error: errors[0],
        numberOfErrors: testEntity.numberOfErrors,
        RollupValues: [
            testEntity.rollup_passed,
            testEntity.rollup_failed,
            testEntity.rollup_skipped,
        ],
        totalRollupValue: testEntity.rollup_tests,
        entityName: testEntity.entityName,
        entityVersion: testEntity.entityVersion,
        simplified: testEntity.simplified,
        hooks: testEntity.hooks,
        Parent: testEntity.parent,
        Tags: testEntity.tags,
        type: testEntity.suiteType,
        Contribution: Number(
            ((testEntity.rollup_tests / totalTestsInATestRun) * 1e2).toFixed(2),
        ),
        hasChildSuite: Boolean(testEntity.hasChildSuite),
    };
}

export function spawnConverter(): Convert {
    return new Convert({
        newline: true,
        colors: {
            0: 'black',
            1: 'red',
            2: 'green',
            3: 'yellow',
            4: 'blue',
            5: 'magenta',
            6: 'cyan',
            7: 'gray',
            8: 'darkGray',
            9: 'lightRed',
            10: 'lightGreen',
            11: 'lightYellow',
            12: 'lightBlue',
            13: 'lightMagenta',
            14: 'lightCyan',
            15: 'white',
        },
    });
}
