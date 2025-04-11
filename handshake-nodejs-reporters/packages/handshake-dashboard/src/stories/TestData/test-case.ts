import type { ParsedTestRecord } from 'types/parsed-records';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { Chance } from 'chance';
import type { AssertionRecord, ImageRecord } from 'types/test-entity-related';

dayjs.extend(duration);
export const generator = new Chance();

export function generateSampleTestCase(): ParsedTestRecord {
    return {
        Desc: 'Description of the test case',
        Title: 'Sample Test Case',
        Duration: dayjs.duration({ seconds: 10 }),
        Ended: dayjs().subtract(10, 'seconds'),
        Started: dayjs().subtract(20, 'seconds'),
        numberOfAssertions: generator.integer({ min: 0 }),
        Id: generator.unique(generator.state, 1)[0],
        numberOfErrors: generator.integer({ min: 0, max: 3 }),
        Tests: 0,
        Parent: generator.unique(generator.state, 1)[0],
        Status: generator.pickone(['FAILED', 'PASSED', 'SKIPPED']),
        Rate: [0, 1, 0, 1, 2],
        totalRollupValue: 0,
        type: 'TEST',
        Tags: generator
            .n(generator.company, generator.integer({ min: 0, max: 3 }))
            .map((tag) => ({ label: tag, name: 'generated-tags' })),
        errors: [],
    };
}

export const randomImages = (length: number) =>
    generator.pickset(
        [
            'https://i.pinimg.com/originals/94/51/42/945142c213d403b1037d8daae8e463b9.gif',
            'https://w0.peakpx.com/wallpaper/171/679/HD-wallpaper-rem-anime-azul-emilia-ramchi-re-re-zero-subaru-waifu-zero-thumbnail.jpg',
            'https://images8.alphacoders.com/718/718523.png',
            'https://images2.alphacoders.com/701/701500.png',
            'https://w0.peakpx.com/wallpaper/17/971/HD-wallpaper-rem-anime-thumbnail.jpg',
            'https://images8.alphacoders.com/718/718511.png',
        ],
        length,
    );

export function generateSampleWrittenAttachment(properties?: {
    no_image?: boolean;
}): ImageRecord {
    return {
        entity_id: generator.unique(generator.state, 1)[0],
        file: generator.name() + '.png',
        url: properties?.no_image ? '' : randomImages(1)[0],
        title: generator.company(),
        description: generator.paragraph(),
        type: 'PNG',
    };
}

export function generateSampleAssertion(): AssertionRecord {
    return {
        entity_id: generator.unique(generator.state, 1)[0],
        interval: generator.integer({ min: 500, max: 5000 }),
        wait: generator.integer({ min: 500, max: 1000 }),
        title: generator.company(),
        passed: generator.bool(),
        message: generator.paragraph(),
    };
}
