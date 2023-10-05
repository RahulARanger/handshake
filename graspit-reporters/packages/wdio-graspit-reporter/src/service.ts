import type { ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import {
  setTimeout,
  clearTimeout,
} from 'node:timers';
import { existsSync, mkdirSync } from 'node:fs';
import type { Capabilities, Options, Services } from '@wdio/types';
import {
  ping, startService, isServerTerminated, terminateServer,
  updateRunConfig, generateReport,
  markTestRunCompletion,
} from 'graspit-commons';
import { ContactsForService } from './contacts';

export default class GraspItService
  extends ContactsForService
  implements Services.ServiceInstance {
  pyProcess?: ChildProcess;

  patcher?: ChildProcess;

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
    const { root: rootDir, port, projectName } = this.options;
    this.logger.info('Starting py-process 🚚...');
    const { resultsDir } = this;

    if (!existsSync(resultsDir)) {
      mkdirSync(resultsDir);
    }

    this.pyProcess = startService(
      projectName ?? options.framework ?? 'unknown',
      resultsDir,
      rootDir ?? process.cwd(),
      port ?? 6969,
    );

    // important for avoiding zombie py server
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- not sure how to solve this
    process.on('exit', async () => {
      this.patcher?.kill('SIGINT');
      await this.sayBye();
    });
  }

  async onWorkerStart(): Promise<unknown> {
    await Promise.resolve(this.waitUntilItsReady.bind(this)());
    return {};
  }

  async forceKill(): Promise<unknown> {
    if (this.pyProcess?.killed) return;
    if (await isServerTerminated()) {
      await this.sayBye();
      this.pyProcess?.kill('SIGINT');
      this.logger.warn('→ Had to 🗡️ the py-process.');
    }
  }

  async sayBye(): Promise<unknown> {
    if (this.pyProcess?.killed) {
      this.logger.warn('🙀 graspit process was already terminated.');
      return;
    }

    await terminateServer();

    this.logger.info('→ Py Process was closed 😪');
  }

  async waitUntilItsReady(): Promise<unknown> {
    return ping().catch(this.sayBye.bind(this));
  }

  async flagToPyThatsItsDone(): Promise<void> {
    // closing graspit server for now.
    await this.sayBye();

    const reportError = new Error(
      'Failed to generate Report on time 😢, please note the errors if any seen.',
    );

    this.patcher = await generateReport(
      this.resultsDir,
      this.options.root || process.cwd(),
      this.options.out,
    );

    return new Promise((resolve, reject) => {
      const bomb = setTimeout(() => {
        if (!this.patcher?.killed) this.patcher?.kill('SIGINT');
        reject(reportError);
      }, this.options.timeout);

      this.patcher?.on('exit', (exitCode) => {
        clearTimeout(bomb);

        if (exitCode !== 0) { return reject(reportError); }

        this.logger.info(
          this.options.out
            ? `Results are generated 🤩, please feel free to run "graspit display ${this.options.out}"`
            : 'Results are patched 🤩. Now we are ready to export it.',
        );
        return resolve();
      });
    });
  }

  async onComplete(
    exitCode: number,
    config: Options.Testrunner,
    // capabilities: Capabilities.RemoteCapabilities
  ): Promise<unknown> {
    const cap = config.capabilities as Capabilities.DesiredCapabilities;
    const platformName = String(cap.platformName);

    await updateRunConfig({
      maxTestRuns: 100,
      platformName,
    });

    const completed = this.pyProcess?.killed;
    if (completed) return this.pyProcess?.exitCode === 0;

    await markTestRunCompletion();
    return this.flagToPyThatsItsDone();
  }
}
