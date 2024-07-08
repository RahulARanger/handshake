import { currentReporter } from './contacts';

export default function skipIfRequired() {
  if (currentReporter == null || currentReporter?.skipTestRun) {
    currentReporter?.logger.info({
      note: 'skipping',
      what: 'test',
      why: 'as requested',
    });
    return true;
  }
  if (currentReporter.currentTestID == null) {
    currentReporter?.logger.error({
      why: 'no-test-id-found',
      so: 'skipping',
    });
    return true;
  }
  return false;
}
