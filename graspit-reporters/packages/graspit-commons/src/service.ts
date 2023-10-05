import log4js from 'log4js';
import superagent from 'superagent';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import type { ChildProcess } from 'node:child_process';
import ReporterDialPad from './helpers';

const logger = log4js.getLogger('graspit-service-commons');

export const venv = join('venv', 'Scripts', 'activate');

export function startService(
  projectName: string,
  resultsDir: string,
  rootDir: string,
  port: number,
): ChildProcess {
  const command = `"${venv}" && graspit run-app ${projectName} "${resultsDir}" -p ${port} -w 2`;
  logger.warn(`Requesting a graspit server, command used: ${command}`);

  const pyProcess = spawn(command, {
    shell: true,
    stdio: 'inherit',
    cwd: rootDir,
  });

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

export function ping(): Promise<unknown> {
  const waitingForTheServer = new Error(
    'Not able to connect with server within 10 seconds 😢, please try again later',
  );

  return new Promise((resolve, reject) => {
    const bomb = setTimeout(() => {
      reject(waitingForTheServer);
    }, 10e3);

    const timer = setInterval(() => {
      logger.warn('pinging py-server 👆...');

      superagent.get(`${ReporterDialPad.url}/`)
        .then((resp) => {
          if (resp.status !== 200) return;
          clearTimeout(bomb);
          clearInterval(timer);

          logger.info('Server is online! 😀');
          resolve({});
        })
        .catch(() => {
          logger.warn('😓 Server has not started yet...');
        });
    }, 3e3);
  });
}

export async function isServerTerminated(): Promise<boolean> {
  const resp = await superagent.get(`${ReporterDialPad.url}/`);
  const wasTerminated = resp.status === 200;
  if (!wasTerminated) logger.warn('→ Had to 🗡️ the py-process.');
  return wasTerminated;
}

export async function terminateServer() {
  const results = [];
  for (let worker = 0; worker < 2; worker += 1) {
    logger.info('📞 Requesting for worker termination');
    results.push(
      superagent.post(`${ReporterDialPad.url}/bye`).retry(2).catch(() => {
        logger.info('Terminated.');
      }),
    );
  }
  await Promise.all(results);
}

export async function updateRunConfig(payload: any) {
  logger.info(
    `📃 Updating config for this current test run with ${payload}.`,
  );

  const resp = await superagent
    .put(ReporterDialPad.updateRunConfig)
    .send(JSON.stringify(payload));

  logger.info(
    `Updated config 🐰 for the test run: ${resp.text}`,
  );
  return resp;
}

export async function generateReport(
  resultsDir: string,
  rootDir: string,
  outDir?: string,
): Promise<ChildProcess> {
  const script = `"${venv}" && graspit patch "${resultsDir}"`;

  const patcher = spawn(
    `${script} && ${outDir ? `cd "${process.cwd()}" && graspit export "${resultsDir}" --out "${outDir}"` : ''}`,
    {
      shell: true,
      cwd: rootDir,
      stdio: 'inherit',
    },
  );
  return patcher;
}

export async function markTestRunCompletion() {
  await superagent.put(`${ReporterDialPad.url}/done`).retry(3).then(
    async (data) => {
      logger.info(`Marked Test Run: ${data.text} for patching.`);
    },
  );
}
