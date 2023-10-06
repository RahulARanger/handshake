import type { ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import {
  setTimeout,
  setInterval,
  clearTimeout,
} from 'node:timers';
import { existsSync, mkdirSync } from 'node:fs';
import type { Capabilities, Options, Services } from '@wdio/types';
import { ContactsForService } from './contacts';

export default class GraspItService
  extends ContactsForService
  implements Services.ServiceInstance {
  pyProcess?: ChildProcess;

  patcher?: false | ChildProcess;

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

    this.pyProcess = this.supporter.startService(
      projectName ?? options.framework ?? 'unknown',
      resultsDir,
      rootDir,
      port ?? 6969,
    );

    // important for avoiding zombie py server
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- not sure how to solve this
    process.on('exit', async () => {
      if (this.patcher) this.patcher?.kill('SIGINT');
      await this.sayBye();
    });
  }

  async onWorkerStart(): Promise<unknown> {
    await Promise.resolve(this.waitUntilItsReady.bind(this)());
    return {};
  }

  async forceKill(): Promise<unknown> {
    if (this.pyProcess?.killed) return;
    if (await this.supporter.isServerTerminated()) {
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

    await this.supporter.terminateServer();

    this.logger.info('→ Py Process was closed 😪');
  }

  async waitUntilItsReady(): Promise<unknown> {
    const waitingForTheServer = new Error(
      'Not able to connect with server within 10 seconds 😢, please try again later',
    );
    return new Promise((resolve, reject) => {
      const bomb = setTimeout(() => {
        reject(waitingForTheServer);
      }, 10e3);

      const timer = setInterval(async () => {
        const isOnline = await this.supporter.ping();
        if (isOnline) {
          clearTimeout(bomb);
          clearInterval(timer);

          this.logger.info('Server is online! 😀');
          resolve({});
        } else {
          this.logger.warn('Server seems to be lazy today 😓, pinging again...');
        }
      }, 3e3);
    }).catch(this.sayBye.bind(this));
  }

  async flagToPyThatsItsDone(): Promise<void> {
    // closing graspit server for now.
    await this.sayBye();

    const reportError = new Error(
      'Failed to generate Report on time 😢, please note the errors if any seen.',
    );

    this.patcher = await this.supporter.generateReport(
      this.resultsDir,
      this.options.root || process.cwd(),
      this.options.out,
    );

    return new Promise((resolve, reject) => {
      if (!this.patcher) {
        resolve();
        return;
      }
      const bomb = setTimeout(() => {
        if (this.patcher && !this.patcher?.killed) this.patcher?.kill('SIGINT');
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

    await this.supporter.updateRunConfig({
      maxTestRuns: 100,
      platformName,
    });

    const completed = this.pyProcess?.killed;
    if (completed) return this.pyProcess?.exitCode === 0;

    await this.supporter.markTestRunCompletion();
    return this.flagToPyThatsItsDone();
  }
}
