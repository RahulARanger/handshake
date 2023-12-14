import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import type { Options, Services } from '@wdio/types';
import { ContactsForService } from './contacts';

export default class HandshakeService
  extends ContactsForService
  implements Services.ServiceInstance {
  get resultsDir(): string {
    return join(
      this.options.root ?? process.cwd(),
      this.options.collectionName ?? 'Test Results',
    );
  }

  // eslint-disable-next-line class-methods-use-this
  get venv(): string {
    return join('venv', 'Scripts', 'activate');
  }

  async flagToPyThatsItsDone() {
    // closing graspit server for now.
    await this.supporter.terminateServer();

    const hasError = this.supporter.generateReport(
      this.resultsDir,
      this.options.root || process.cwd(),
      this.options?.export?.out,
      this.options?.export?.maxTestRuns,
      this.options?.export?.skipPatch,
      this.options.timeout,
    );
    if (hasError) {
      this.logger.error(`Failed to patch results, because of ${hasError.message}`);
      return;
    }

    this.logger.info(
      this.options.export?.out
        ? `Results are generated 🤩, please feel free to run "graspit display ${this.options.export?.out}"`
        : 'Results are patched 🤩. Now we are ready to export it.',
    );
  }

  onPrepare(options: Options.Testrunner)
  // capabilities: Capabilities.RemoteCapabilities
    : void {
    const { root: rootDir } = this.options;
    this.logger.info('😇 Starting py-process.');
    const { resultsDir } = this;

    if (!existsSync(resultsDir)) {
      mkdirSync(resultsDir);
    }

    this.supporter.startService(
      this.options.testConfig.projectName ?? options.framework ?? 'unknown',
      resultsDir,
      rootDir,
    );
  }

  async onWorkerStart(): Promise<unknown> {
    return this.supporter.waitUntilItsReady();
  }

  async onComplete(
    exitCode: number,
    config: Options.Testrunner,
    // capabilities: Capabilities.RemoteCapabilities
  ): Promise<unknown> {
    const cap = config.capabilities as WebdriverIO.Capabilities;
    const platformName = String(cap?.platformName ?? process.platform);

    await this.supporter.updateRunConfig({
      maxInstances: config.maxInstances ?? 1,
      platformName,
      framework: config.framework ?? 'WebdriverIO',
      avoidParentSuitesInCount: this.options.testConfig.avoidParentSuitesInCount ?? false,
      fileRetries: config.specFileRetries ?? 0,
      saveOptions: {
        bail: config.bail,
        protocol: config.baseUrl,
      },
      exitCode,
    });

    const completed = this.supporter.pyProcess?.killed;
    if (completed) return this.supporter.pyProcess?.exitCode === 0;

    await this.supporter.markTestRunCompletion();
    return this.flagToPyThatsItsDone();
  }
}
