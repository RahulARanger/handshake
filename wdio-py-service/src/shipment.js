/* eslint-disable import/extensions */
import { spawn, ChildProcess, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import {
    clearInterval, setTimeout, clearTimeout, setInterval,
} from 'node:timers';
// eslint-disable-next-line import/no-unresolved
import logger from '@wdio/logger';
import ContactList from './referenceUrls.js';

export default class Shipment extends ContactList {
    logger = logger('wdio-py-service');

    /**
     * @type {ChildProcess}
     */
    pyProcess;

    /**
     *
     * @param {import("@wdio/types").Options.WebdriverIO} _
     * Config used for the webdriverIO tests
     */
    async onPrepare(_) {
        const path = join('venv', 'Scripts', 'activate');
        const {
            root: rootDir, port, collectionName, projectName,
        } = this.options;
        this.logger.warn('Preparing the Template for the report 📦');

        const output = spawnSync(
            `"${path}" && next-py init-shipment -s "${collectionName}" -o "${rootDir}"`,
            { cwd: rootDir, shell: true, stdio: ['ignore', 'pipe', 'pipe'] },
            { cwd: rootDir },
        );

        this.logger.info(output?.stdout?.toString());
        if (output?.stderr?.length ?? 0) this.logger.error(output?.stderr?.toString());

        const command = `"${path}" && next-py run-app ${projectName} "${join(rootDir, collectionName)}" -p ${port} -w 2`;
        this.pyProcess = spawn(
            command,
            // 'echo \'za warudo\'',
            { cwd: rootDir, shell: true, stdio: ['ignore', 'pipe', 'pipe'] },
            { cwd: rootDir },
        );

        this.pyProcess.stdout.on('data', (data) => this.logger.info(data?.toString()));
        this.pyProcess.stderr.on('data', (data) => this.logger.warn(data?.toString()));

        this.pyProcess.on('error', (err) => { throw new Error(String(err)); });
        // comment below line for debugging sanic server
        this.pyProcess.on('exit', (code) => { throw new Error(`→ Failed to generate the report, Error Code: ${code}`); });

        this.logger.warn(`pid: ${this.pyProcess.pid}`);

        process.on('exit', async () => { await this.forceKill(); });
    }

    async onWorkerStart() {
        await Promise.resolve(this.waitUntilItsReady.bind(this)());
    }

    async forceKill() {
        if (this.pyProcess.killed) return;
        if ((await fetch(`${this.url}/`)).status === 200) {
            this.pyProcess.kill('SIGINT');
            this.logger.warn('→ Had to 🗡️ the py-process.');
        }
    }

    async sayBye() {
        if (this.pyProcess.killed) return;
        this.logger.warn('→ See you later py-process 👋');
        try {
            await fetch(`${this.url}/bye`, { method: 'POST' });
        } catch {
            this.logger.info('→ Server is offline as expected. 😪');
        }
    }

    async waitUntilItsReady() {
        const waitingForTheServer = new Error(
            'Not able to connect with server within 10 seconds 😢, please try again later',
        );

        return new Promise((resolve, reject) => {
            const bomb = setTimeout(() => { reject(waitingForTheServer); }, 10e3);

            const timer = setInterval(() => {
                this.logger.warn('pinging py-server 👆...');

                fetch(`${this.url}/`).then((resp) => {
                    if (resp.status !== 200) return;
                    clearTimeout(bomb); clearInterval(timer);

                    this.logger.info('Server is online! 😀');
                    resolve();
                });
            }, 3e3);
        }).catch(this.sayBye.bind(this));
    }

    async flagToPyThatsItsDone() {
        const explain = new Error('→ There were some pending tasks that was not completed on time 😓, try increasing the timeout or job related spec');

        return new Promise((resolve, reject) => {
            // 5 seconds buffer
            const bomb = setTimeout(() => { reject(explain); }, this.options.timeout + 5e3);

            const timer = setInterval(() => {
                this.logger.warn('→ Waiting for the py-process to complete ⏲️...');

                fetch(`${this.url}/isItDone`).then((data) => data.json()).then(
                    (data) => {
                        if (!data.done) { this.logger.warn(`→ Pending Tasks ⚒️: ${data.message}`); return; }

                        clearTimeout(bomb);
                        clearInterval(timer);
                        resolve();
                    },
                );
            }, 1e3);
        })
            .catch(this.sayBye.bind(this))
            .then(this.sayBye.bind(this));
    }

    async onComplete() {
        const completed = this.pyProcess.killed;
        if (completed) return this.pyProcess.exitCode === 0;
        await fetch(`${this.url}/done`, { method: 'PUT' }).then(async (data) => this.logger.info(await data.text()));
        return this.flagToPyThatsItsDone();
    }
}
