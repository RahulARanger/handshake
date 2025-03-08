const TEXTS = {
    SUITE: {
        title: 'Suite Detailed View',
        description:
            'In this page, you can view the details of the requested suiteID else you can choose the suites available from the test run',
    },
    AUTHOR: 'RahulARanger <saihanumarahul66@gmail.com>',
};

export default TEXTS;

export function captialize(x: string) {
    return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase();
}

/**
 * Get a random integer between `min` and `max`.
 * https://gist.github.com/kerimdzhanov/7529623
 *
 * @param {number} min - min number
 * @param {number} max - max number
 * @return {number} a random integer
 */
export function getRandomInt(mini, maxi) {
    return Math.floor(Math.random() * (maxi - mini + 1) + mini);
}
