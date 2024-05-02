import { existsSync, mkdirSync } from 'node:fs';
import type { Options, Services } from '@wdio/types';
import { frameworksUsedString } from 'common-handshakes';
import { ContactsForService } from './contacts';

export default class HandshakeService
  extends ContactsForService
  implements Services.ServiceInstance {
  async flagToPyThatsItsDone() {
    // closing handshake server for now.
    await this.supporter.terminateServer();
    if (!this.options.exportOutDir) {
      this.logger.info({ for: 'generate-report', note: 'skipping reports as exportOutDir is not set' });
      return;
    }

    try {
      await this.supporter.generateReport(
        this.resultsDir,
        this.options.root || process.cwd(),
        this.options?.exportOutDir,
        this.options.reportGenerationTimeout,
      );
    } catch (err) {
      this.logger.error({ for: 'generate-report', err });
    }
  }

  onPrepare(options: Options.Testrunner)
  // capabilities: Capabilities.RemoteCapabilities
    : void {
    const { root: rootDir } = this.options;
    const { resultsDir } = this;

    if (!existsSync(resultsDir)) {
      mkdirSync(resultsDir);
    }

    this.supporter.startService(
      this.options.testConfig.projectName ?? options.framework ?? 'unknown',
      resultsDir,
      rootDir,
      this.options.workers,
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
      framework: frameworksUsedString(['WebdriverIO', config.framework ?? '']),
      avoidParentSuitesInCount: this.options.testConfig.avoidParentSuitesInCount ?? false,
      fileRetries: config.specFileRetries ?? 0,
      bail: config.bail ?? 0,
      exitCode,
    });

    const completed = this.supporter.pyProcess?.killed;
    if (completed) return this.supporter.pyProcess?.exitCode === 0;

    await this.supporter.markTestRunCompletion();
    return this.flagToPyThatsItsDone();
  }
}
