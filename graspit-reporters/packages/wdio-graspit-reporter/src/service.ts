import { join } from 'node:path';
import {
  setTimeout,
  clearTimeout,
} from 'node:timers';
import { existsSync, mkdirSync } from 'node:fs';
import type { Options, Services } from '@wdio/types';
import { ContactsForService } from './contacts';

export default class GraspItService
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

  onPrepare(options: Options.Testrunner)
  // capabilities: Capabilities.RemoteCapabilities
    : void {
    const { root: rootDir, projectName } = this.options;
    this.logger.info('Starting py-process 🚚...');
    const { resultsDir } = this;

    if (!existsSync(resultsDir)) {
      mkdirSync(resultsDir);
    }

    this.supporter.startService(
      projectName ?? options.framework ?? 'unknown',
      resultsDir,
      rootDir,
    );
  }

  async onWorkerStart(): Promise<unknown> {
    await Promise.resolve(this.supporter.waitUntilItsReady);
    return {};
  }

  async flagToPyThatsItsDone(): Promise<void> {
    // closing graspit server for now.
    await this.supporter.terminateServer();

    const reportError = new Error(
      'Failed to generate Report on time 😢, please note the errors if any seen.',
    );
    return new Promise((resolve, reject) => {
      const bomb = setTimeout(async () => {
        reject(reportError);
      }, this.options.timeout);

      const hasError = this.supporter.generateReport(
        this.resultsDir,
        this.options.root || process.cwd(),
        this.options?.export?.out,
        this.options?.export?.isDynamic,
        this.options?.export?.maxTestRuns,
        this.options?.export?.skipPatch,
      );

      if (hasError) {
        this.logger.error(`Failed to patch results, because of ${hasError.message}`);
        reject(reportError);
        return;
      }

      clearTimeout(bomb);
      this.logger.info(
        this.options.export?.out
          ? `Results are generated 🤩, please feel free to run "graspit display ${this.options.export?.out}"`
          : 'Results are patched 🤩. Now we are ready to export it.',
      );
      resolve();
    });
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
    });

    const completed = this.supporter.pyProcess?.killed;
    if (completed) return this.supporter.pyProcess?.exitCode === 0;

    await this.supporter.markTestRunCompletion();
    return this.flagToPyThatsItsDone();
  }
}
