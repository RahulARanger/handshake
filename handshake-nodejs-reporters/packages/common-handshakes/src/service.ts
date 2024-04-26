import superagent from 'superagent';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout, setInterval, clearTimeout } from 'node:timers';
import type { ChildProcess } from 'node:child_process';
import pino, { Level, Logger } from 'pino';
import { parse } from 'shell-quote';
import DialPad from './dialPad';
import { UpdateTestRunConfig } from './payload';

// eslint-disable-next-line import/prefer-default-export
export class ServiceDialPad extends DialPad {
  pyProcess?: ChildProcess;

  logger: Logger;

  workers: number = 2;

  /**
   * constructs the service it is responsible for starting the handshake-server.
   * and it also ensures we are using the correct version of handshake or not.
   * @param {number} port port where we would need handshake server to run
   * @param {Level} logLevel log level for the logger at this service
   */
  constructor(port: number, logLevel?: Level, disabled?:boolean) {
    super(port, disabled);
    this.logger = pino({ name: 'handshake-service-feeder', level: logLevel?.toLowerCase() ?? 'info' });
  }

  /**
   * url for updating the configuration of a test run
   */
  get updateRunConfigUrl(): string {
    return `${this.saveUrl}/currentRun`;
  }

  /**
 * helper to spawn a process mostly used to call handshake server.
 * @param {string[]} args args that we need to pass to a process
 * @param {boolean} isSync spawn or spawnSync
 * @param {string} cwd u know this
 * @param {number | undefined} timeout timeout for the process to start, its optional
 * @returns
 */
  executeCommand(
    args: string[],
    isSync: boolean,
    cwd: string,
    timeout?: number,
  ) {
    if (this.disabled) return false;

    const starter = isSync ? spawnSync : spawn;

    this.logger.info({ args, cwd, for: 'executingCommand' });

    return starter(this.exePath, args, {
      timeout,
      shell: true,
      cwd,
      stdio: 'inherit',
      detached: false,
    });
  }

  /**
   * starts the handshake test run, now server would listen to our results once invoked
   * @param projectName project-name label for the test run
   * @param resultsDir results directory where attachments and db would be saved.
   * @param rootDir root directory
   * @param workers number of workers for the handshake server, more the number.
   * faster it would be
   * @returns
   */
  startService(
    projectName: string,
    resultsDir: string,
    rootDir: string,
    workers?: number,
  ): ChildProcess | undefined {
    if (this.disabled) return undefined;

    this.workers = Math.max(workers ?? 1, 2);
    this.logger.info({ rootDir, for: 'requestingServer' });

    const command = parse('run-app $p $r -p $port -w $workers', {
      p: projectName,
      r: resultsDir,
      port: this.port.toString(),
      workers: this.workers.toString(),
    }) as string[];
    command[1] = `"${command[1]}"`;
    command[2] = `"${command[2]}"`;

    const pyProcess = this.executeCommand(
      command,
      false,
      rootDir,
    ) as ChildProcess;
    this.pyProcess = pyProcess;
    pyProcess.stdout?.on('data', (chunk) => this.logger.info({ type: 'stdout', chunk: chunk.toString() }));
    pyProcess.stderr?.on('data', (chunk) => this.logger.info({ type: 'stderr', chunk: chunk.toString() }));

    pyProcess.on('error', (err: Buffer) => {
      throw new Error(String(err));
    });

    pyProcess.on('exit', (code) => {
      if (code !== 0) {
        this.logger.warn(
          { for: 'serverExited', code },
        );
      }
    });

    this.logger.info({ for: 'handshakeServer', pid: pyProcess.pid });

    // important for avoiding zombie py server
    process.on('exit', async () => {
      pyProcess.kill('SIGINT');
      await this.terminateServer();
    });

    return pyProcess;
  }

  /**
   * checks if the handshake-server has started
   * @returns {boolean} returns true if the server responded to ping else false
   */
  async ping(): Promise<boolean> {
    if (this.disabled) return true;

    const resp = await superagent
      .get(`${this.url}/`)
      .catch(() => this.logger.info({ for: 'retryingPing' }));

    this.logger.debug({ for: 'pingStatus', status: resp?.statusCode ?? '404' });
    return resp?.statusCode === 200;
  }

  /**
   * waits until the server is up
   * @param timeout optional parameter in milliseconds to wait for the server
   * @returns
   */
  async waitUntilItsReady(timeout?: number) {
    if (this.disabled) return;

    const waitingForTheServer = new Error(
      '🔴 Not able to connect with handshake-server within a minute. Please try running this again, else report this as an issue.',
    );
    await new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout;
      let bomb: NodeJS.Timeout;
      const cleanup = () => {
        clearTimeout(bomb);
        clearInterval(timer);
      };

      bomb = setTimeout(async () => {
        cleanup();
        await this.terminateServer();
        reject(waitingForTheServer);
      }, timeout ?? 60e3);

      timer = setInterval(async () => {
        const isOnline = await this.ping();

        if (isOnline) {
          cleanup();
          this.logger.debug({
            for: 'handshake-server is online now',
          });
          resolve({});
        } else {
          this.logger.info({ for: 'pinging server again' });
        }
      }, 3e3);
    });
  }

  /**
   * checks if the handshake-server has terminated or not
   * @returns {boolean} true if it has terminated else false
   */
  async isServerTerminated(): Promise<boolean> {
    if (this.disabled || this.pyProcess?.killed) return true;
    const resp = await superagent
      .get(`${this.url}/`)
      .catch(() => this.logger.info({ for: 'retryingPing' }));
    const wasTerminated = resp?.statusCode !== 200;
    if (!wasTerminated) this.logger.warn({ crime: '🗡️', victim: 'handshake-server', murderer: 'me' });
    return wasTerminated;
  }

  /**
   * terminates the server
   */
  async terminateServer() {
    if (this.disabled) return;
    this.logger.debug({ for: 'scaling handshake-server down' });

    try {
      await superagent
        .post(`${this.url}/bye`)
        .retry(2);
    } catch (error) {
      const specialError = error as { code?: string };
      if (specialError?.code === 'ECONNREFUSED') this.logger.info({ for: 'handshake server is now down' });
      else this.logger.warn({ for: 'handshake-server is down due to different reason', why: error });
    }

    if (this.pyProcess?.pid) {
      try {
        process.kill(this.pyProcess.pid);
      } catch {
        this.logger.debug({ note: 'handshake-server was alreeady closed' });
      }
    }
  }

  async updateRunConfig(payload: UpdateTestRunConfig) {
    if (this.disabled) return undefined;
    this.logger.debug(
      { for: 'update-runConfig', payload },
    );
    const resp = await superagent
      .put(this.updateRunConfigUrl)
      .send(JSON.stringify(payload))
      .catch((err) => this.logger.error({ error: err, for: 'update-runConfig' }));

    if (resp) {
      this.logger.info({ for: 'update-runConfig', response: resp.text });
    }
    return resp;
  }

  async markTestRunCompletion() {
    if (this.disabled) return;

    await superagent
      .put(`${this.url}/done`)
      .retry(3)
      .then(async (data) => {
        this.logger.info({
          for: 'mark-test-run-completion',
          text: data.text,
        });
      })
      .catch((err) => this.logger.error({ for: 'mark-test-run-completion', err }));
  }

  // generateReport(
  //   resultsDir: string,
  //   rootDir: string,
  //   outDir?: string,
  //   skipPatch?: boolean,
  //   timeout?: number,
  // ): false | Error | undefined {
  //   if (skipPatch) {
  //     this.logger.warn(
  //       { note: 'patching was skipped as requested', so:
  // 'please run the patch the requested command manually.',
  //  command: `handshake patch ${rootDir}` },
  //     );
  //     return false;
  //   }
  //   const patchArgs = ['patch', `"${resultsDir}"`];
  //   if (outDir == null) {
  //     this.logger.debug(
  //       { for: 'patching as requested' },
  //     );
  //   }

  //   // for patching
  //   const result = this.executeCommand(
  //     patchArgs,
  //     true,
  //     rootDir,
  //     timeout,
  //   ) as SpawnSyncReturns<Buffer>;
  //   return result.error;
  // }
}
