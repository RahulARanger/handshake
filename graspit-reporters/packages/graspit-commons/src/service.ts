import log4js from 'log4js';
import superagent from 'superagent';
import {
  spawn, spawnSync,
} from 'node:child_process';
import { join } from 'node:path';
import {
  setTimeout,
  setInterval,
  clearTimeout,
} from 'node:timers';
import type { ChildProcess, SpawnSyncReturns } from 'node:child_process';
import DialPad from './dialPad';

const logger = log4js.getLogger('graspit-service-commons');

const isWindows = () => process.platform === 'win32' || /^(msys|cygwin)$/.test(process.env.OSTYPE ?? '');

// eslint-disable-next-line import/prefer-default-export
export class ServiceDialPad extends DialPad {
  pyProcess?: ChildProcess;

  // eslint-disable-next-line class-methods-use-this
  get venv() {
    return join('venv', isWindows() ? 'Scripts' : 'bin', 'activate');
  }

  get updateRunConfigUrl(): string {
    return `${this.saveUrl}/currentRun`;
  }

  get activateVenvScript() {
    return isWindows() ? `"${this.venv}"` : `source "${this.venv}"`;
  }

  executeCommand(args: string[], isSync: boolean, cwd: string) {
    const starter = isSync ? spawnSync : spawn;

    if (this.exePath == null) {
      const command = `"${this.activateVenvScript}" && graspit ${args.join(' ')}`;
      logger.info(`🧑‍🔬 Executing a command: ${command} from ${cwd}`);
      return starter(command, { shell: true, stdio: 'inherit', cwd });
    }
    logger.info(`🪖 Execute with ${args} for ${this.exePath} from ${cwd} => ${args.join(' ')}`);

    return starter(
      this.exePath,
      args,
      { shell: false, cwd, stdio: 'inherit' },
    );
  }

  patchArgPath(arg: string) {
    return this.exePath ? arg : `"${arg}"`;
  }

  startService(
    projectName: string,
    resultsDir: string,
    rootDir: string,
  ): ChildProcess {
    const args = ['run-app', projectName, this.patchArgPath(resultsDir), '-p', this.port.toString(), '-w', '2'];
    logger.warn(`Requesting a graspit server, command used: ${args.join(' ')} from ${rootDir}`);

    const pyProcess = this.executeCommand(args, false, rootDir) as ChildProcess;

    pyProcess.stdout?.on('data', (chunk) => logger.info(chunk.toString()));
    pyProcess.stderr?.on('data', (chunk) => logger.error(chunk.toString()));

    pyProcess.on('error', (err: Buffer) => {
      throw new Error(String(err));
    });

    pyProcess.on('exit', (code) => {
      if (code !== 0) {
        logger.warn(
          `graspit was force closed 😫, found exit code: ${code}`,
        );
      }
    });

    logger.info(
      `Started py-process, running 🐰 at pid: ${pyProcess.pid}`,
    );

    // important for avoiding zombie py server
    process.on('exit', async () => {
      pyProcess.kill('SIGINT');
      await this.terminateServer();
    });

    return pyProcess;
  }

  async ping(): Promise<boolean> {
    logger.warn('pinging py-server 👆...');

    try {
      const resp = await superagent.get(`${this.url}/`);
      return resp.statusCode === 200;
    } catch {
      return false;
    }
  }

  async waitUntilItsReady(): Promise<unknown> {
    const waitingForTheServer = new Error(
      'Not able to connect with graspit-server within 10 seconds 😢, Please start again without interruption.',
    );
    return new Promise((resolve, reject) => {
      const bomb = setTimeout(() => {
        reject(waitingForTheServer);
      }, 10e3);

      const timer = setInterval(async () => {
        const isOnline = await this.ping();
        if (isOnline) {
          clearTimeout(bomb);
          clearInterval(timer);

          logger.info('Server is online! 😀');
          resolve({});
        } else {
          logger.warn('😓 pinging server again...');
        }
      }, 3e3);
    }).catch(this.terminateServer.bind(this));
  }

  async isServerTerminated(): Promise<boolean> {
    if (this.pyProcess?.killed) return true;
    const resp = await superagent.get(`${this.url}/`);
    const wasTerminated = resp.statusCode === 200;
    if (!wasTerminated) logger.warn('→ Had to 🗡️ the py-process.');
    return wasTerminated;
  }

  async terminateServer() {
    if (this.pyProcess?.killed) {
      logger.warn('🙀 graspit process was already terminated.');
      return;
    }

    const results = [];
    for (let worker = 0; worker < 2; worker += 1) {
      logger.info('📞 Requesting for worker termination');
      results.push(
        superagent.post(`${this.url}/bye`).retry(2).catch(() => {
          logger.info('→ Py Process was closed 😪');
        }),
      );
    }
    await Promise.all(results);
  }

  async updateRunConfig(payload: any) {
    logger.info(
      `📃 Updating config for this current test run with ${payload}.`,
    );

    const resp = await superagent
      .put(this.updateRunConfigUrl)
      .send(JSON.stringify(payload));

    logger.info(
      `Updated config 🐰 for the test run: ${resp.text}`,
    );
    return resp;
  }

  generateReport(
    resultsDir: string,
    rootDir: string,
    outDir?: string,
    isDynamic?: boolean,
    maxTestRuns?: number,
    skipPatch?: boolean,
  ): false | Error | undefined {
    if (skipPatch) {
      logger.warn('Test Results are not patched, as per request. Make sure to patch it up later.');
      return false;
    }
    const patchArgs = ['patch', this.patchArgPath(resultsDir)];
    if (outDir == null) {
      logger.info(`Patching the results ⛑️, passing the command ${patchArgs}`);
    }

    let result = this.executeCommand(patchArgs, true, rootDir) as SpawnSyncReturns<Buffer>;
    // for patching
    if (outDir != null && result.error == null) {
      const exportArgs = ['export', this.patchArgPath(resultsDir), '--out', this.patchArgPath(outDir), '-r', (maxTestRuns ?? 100).toString()];
      logger.info(`Generating Report 📃, passing the command: ${exportArgs}`);

      result = this.executeCommand(
        exportArgs,
        true,
        process.cwd(),
      ) as SpawnSyncReturns<Buffer>;
      return result.error;
    }
    return result.error;
  }

  async markTestRunCompletion() {
    await superagent.put(`${this.url}/done`).retry(3).then(
      async (data) => {
        logger.info(`Marked Test Run: ${data.text} for patching.`);
      },
    );
  }
}