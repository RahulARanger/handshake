import log4js from 'log4js';
import superagent from 'superagent';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import type { ChildProcess } from 'node:child_process';
import DialPad from './dialPad';

const logger = log4js.getLogger('graspit-service-commons');

// eslint-disable-next-line import/prefer-default-export
export class ServiceDialPad extends DialPad {
  // eslint-disable-next-line class-methods-use-this
  get venv() {
    return join('venv', 'Scripts', 'activate');
  }

  get updateRunConfigUrl(): string {
    return `${this.saveUrl}/currentRun`;
  }

  startService(
    projectName: string,
    resultsDir: string,
    rootDir: string,
    port: number,
  ): ChildProcess {
    const command = `"${this.venv}" && graspit run-app ${projectName} "${resultsDir}" -p ${port} -w 2`;
    logger.warn(`Requesting a graspit server, command used: ${command} from ${rootDir}`);

    const pyProcess = spawn(command, {
      shell: true,
      stdio: 'inherit',
      cwd: rootDir,
    });

    pyProcess.stdout?.on('data', (chunk) => logger.info(chunk.toString()));
    pyProcess.stderr?.on('data', (chunk) => logger.error(chunk.toString()));

    pyProcess.on('error', (err: Buffer) => {
      throw new Error(String(err));
    });

    pyProcess.on('exit', (code) => {
      if (code !== 0) {
        logger.error(
          `graspit was force closed 😫, found exit code: ${code}`,
        );
      }
    });

    logger.info(
      `Started py-process, running 🐰 at pid: ${pyProcess.pid}`,
    );

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

  async isServerTerminated(): Promise<boolean> {
    const resp = await superagent.get(`${this.url}/`);
    const wasTerminated = resp.statusCode === 200;
    if (!wasTerminated) logger.warn('→ Had to 🗡️ the py-process.');
    return wasTerminated;
  }

  async terminateServer() {
    const results = [];
    for (let worker = 0; worker < 2; worker += 1) {
      logger.info('📞 Requesting for worker termination');
      results.push(
        superagent.post(`${this.url}/bye`).retry(2).catch(() => {
          logger.info('Terminated.');
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

  async generateReport(
    resultsDir: string,
    rootDir: string,
    outDir?: string,
    skipPatch?: boolean,
  ): Promise<ChildProcess | false> {
    if (skipPatch) {
      logger.warn('Test Results are not patched, as per request. Make sure to patch it up later.');
      return false;
    }

    const patchScript = `"${this.venv}" && graspit patch "${resultsDir}"`;
    const script = outDir ? `${patchScript} && cd "${process.cwd()}" && graspit export "${resultsDir}" --out "${outDir}"` : patchScript;

    if (outDir == null) {
      logger.info(`Patching the results ⛑️, passing the command ${script}`);
    } else {
      logger.info(`Generating Report 📃, passing the command: ${script}`);
    }

    const patcher = spawn(
      script,
      {
        shell: true,
        cwd: rootDir,
        stdio: 'inherit',
      },
    );
    return patcher;
  }

  async markTestRunCompletion() {
    await superagent.put(`${this.url}/done`).retry(3).then(
      async (data) => {
        logger.info(`Marked Test Run: ${data.text} for patching.`);
      },
    );
  }
}
