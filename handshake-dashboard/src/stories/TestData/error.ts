import { Chance } from 'chance';

const chance = new Chance();

function generateMockStackTrace() {
    const lines = [];
    const filePath = 'Project\\file.js';
    for (let index = 0; index < chance.integer({ min: 5, max: 15 }); index++) {
        lines.push(
            `  at ${chance.name()} (${filePath}:${chance.integer({ min: 10, max: 300 })}:${chance.integer({ min: 5, max: 80 })})`,
        );
    }
    return lines.join('\n');
}

export function generateErrors() {
    return [
        {
            name: chance.pickone([
                'Error',
                'TypeError',
                'ReferenceError',
                'SyntaxError',
            ]),
            message: chance.sentence(),
            stack: generateMockStackTrace(),
        },
    ];
}
