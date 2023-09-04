import WDIOReporter from '@wdio/reporter';

export default class TestReporter extends WDIOReporter {
    onTestPass(_) {
        console.log('test', this);
    }
}
