/* eslint-disable no-console */
import chalk from 'chalk';
import {
  readFileSync, createWriteStream, rmSync, existsSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import superagent from 'superagent';

export const dashboardBuildFile = join(dirname(dirname(fileURLToPath(import.meta.url))), 'dashboard.tar.bz2');

export function getHandshakeVersionFromServer() {
  try {
    const output = spawnSync('handshake', ['v'], { shell: true });
    return output.stdout.toString().trim();
  } catch (error) {
    console.log(chalk.yellowBright('+ Failed to connect with handshake server, it is recommended to install/update common-handshakes (for handshake-dashboard) inside a terminal with venv activated and handshake (python-build) installed'));
    console.error(chalk.red(`  + Connection Error: ${error}`));
    return '';
  }
}

export function installLatestVersion(version) {
  try {
    console.log(chalk.green(`Installing latest version of handshake: ${version}`));
    const result = spawnSync('pip', ['install', `handshakes==${version}`], { shell: true });
    console.log(chalk.grey(result.stdout.toString()));
    if (result.status) throw new Error(result.stderr.toString());
    console.log(chalk.green('Done...'));
    return true;
  } catch (error) {
    console.log(chalk.red('+ Failed to latest version for handshake (python-build) installed'));
    console.error(chalk.red(error));
    return false;
  }
}

export function handshakeVersion() {
  const currentDir = dirname(dirname(fileURLToPath(import.meta.url)));
  const versionFile = join(currentDir, '.version');
  return JSON.parse(readFileSync(versionFile));
}

export function validateConnection(installIfRequired) {
  const versionMeta = handshakeVersion();

  let isSame = false;
  const found = getHandshakeVersionFromServer();
  const hasConnected = found !== '';

  if (hasConnected) {
    isSame = found === versionMeta.version;
  }

  if (isSame) {
    console.log(chalk.green('+ We are at the required version, No changes are required for handshake (python build)'));
  } else if (hasConnected) {
    let failedToInstall = true;
    console.log(
      chalk.yellow(`+ Found the version: v${found} but we need ${versionMeta.version}`),
    );
    if (installIfRequired) failedToInstall = !installLatestVersion(versionMeta.version);
    if (failedToInstall) {
      console.log(
        chalk.yellow(`+ Please run the command: \`pip install handshakes==${found}\``),
      );
    }
  } else {
    console.log(chalk.yellow('+ Please setup python venv and then install handshake ') + chalk.italic('(python build)') + chalk.bold(` of v${versionMeta.version}`));
  }
}

export default async function spawnInstallation() {
  const versionMeta = handshakeVersion();

  validateConnection();

  const dashboardBuild = versionMeta[0].browser_download_url;
  console.log(chalk.blue(`+ Downloading dashboard build from ${dashboardBuild}...`));

  if (existsSync(dashboardBuildFile)) {
    rmSync(dashboardBuildFile);
  }
  const stream = createWriteStream(dashboardBuildFile);
  const request = superagent.get(dashboardBuild);

  await new Promise((resolve, reject) => {
    request.pipe(stream).on('close', () => {
      const code = request.responseType()?.response?.statusCode ?? 404;

      if (code < 300 && code > 199) {
        console.log(chalk.blue('+ Download completed, we can now use the handshake executable.'));
        resolve();
      } else {
        console.warn(chalk.red(`+ Failed to download the handshake executable, please check if this url is still valid: ${dashboardBuild}, found status code: ${code}.\nPlease contact package owner reg. this. if this error is visible even on latest version.`));
        reject();
      }
    });
  }).catch((err) => {
    console.error(chalk.red(`Failed to download the build from ${dashboardBuildFile}, Please raise an issues in Handshake repo. refer this error: ${err} for reference.`));
    // TODO: allow user to execute a command to manually install the build
    // console.error(chalk.blue("Please execute the command: "))})
  });
}
