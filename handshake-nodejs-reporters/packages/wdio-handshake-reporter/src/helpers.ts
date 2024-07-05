import type { Options } from '@wdio/types';
import { Assertion, checkVersion } from '@hand-shakes/common-handshakes';
import { AttachReporterOptions } from './types';
import HandshakeService from './service';
import HandshakeReporter from './reporter';
import { currentReporter } from './contacts';
import skipIfRequired from './internals';

/**
 * adds handshake custom reporter and service. provide the WebdriverIO Configuration
 * and required options to get started.
 * @param config WebdriverIO configuration object
 * @param options options to configure custom reporter and custom service
 * @returns modified WebdriverIO Configuration
 */
export function attachReporter(
  config: Options.Testrunner,
  options: AttachReporterOptions,
): Options.Testrunner {
  if (options.disabled) return config;
  checkVersion();

  const port = options.port ?? 6969;
  const toModify = config;

  toModify.reporters = toModify.reporters || [];
  toModify.services = toModify.services || [];

  toModify.reporters.push([
    HandshakeReporter,
    {
      port,
      addScreenshots: options.addScreenshots || false,
      requestsTimeout: Math.max(
        options.requestsTimeout ?? config.reporterSyncTimeout ?? 60e3,
        60e3,
      ),
      logLevel: options.logLevel ?? config.logLevel ?? 'info',
    },
  ]);

  toModify.services.push([
    HandshakeService,
    {
      port,
      requestsTimeout: Math.max(
        options.requestsTimeout
                    ?? config.connectionRetryTimeout
                    ?? 120e3,
        120e3,
      ),
      reportGenerationTimeout: Math.max(
        options.reportGenerationTimeout ?? 180e3,
        180e3,
      ),
      root: options.root,
      workers: options.workers,
      resultsFolderName: options.resultsFolderName,
      logLevel: options.logLevel ?? config.logLevel ?? 'info',
      testConfig: {
        ...options.testConfig,
        avoidParentSuitesInCount:
                    options.testConfig?.avoidParentSuitesInCount
                    ?? config.framework === 'cucumber',
      },
      exportOutDir: options.exportOutDir,
    },
  ]);

  return toModify;
}

/**
 * attaches custom screenshot to a current test case.
 * @param title title of the screenshot
 * @param content PNG content
 * @param description description for the screenshot
 * @param is_suite is it for suite ? so we take parent of the current test entity
 * @returns
 */
export async function attachScreenshot(
  title: string,
  content: string,
  description?: string,
  is_suite?: boolean,
) {
  if (skipIfRequired()) {
    return;
  }

  await currentReporter?.supporter?.attachScreenshot(
    title,
    content,
    currentReporter?.currentEntity(is_suite),
    description,
  );
}

/**
 * adds a description or the paragraph about the test or suite
 * @param content content to include in the description
 * @param is_suite is it for suite ? so we take parent of the current test entity
 * @returns
 */
export async function addDescription(content: string, is_suite?: boolean) {
  if (skipIfRequired()) {
    return;
  }

  await currentReporter?.supporter?.addDescription(
    content,
    currentReporter?.currentEntity(is_suite),
  );
}

/**
 * adds a link for reference for test or suite
 * @param url as it says
 * @param title title of the link
 * @param is_suite is it for suite ? so we take parent of the current test entity
 * @returns
 */
export async function addLink(url: string, title: string, is_suite?: boolean) {
  if (skipIfRequired()) {
    return;
  }

  await currentReporter?.supporter?.addLink(
    url,
    title,
    currentReporter?.currentEntity(is_suite),
  );
}

/**
 * adds the assertion for the current running test case
 * @param title title of the assertion
 * @param assertion assertion details
 * @returns
 */
export async function addAssertion(title: string, assertion: Assertion) {
  if (skipIfRequired()) {
    return;
  }

  await currentReporter?.supporter?.addAssertion(
    title,
    assertion,
    currentReporter?.currentTestID ?? '',
  );
}
