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
