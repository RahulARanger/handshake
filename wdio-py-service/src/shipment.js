import { spawn, ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import logger from '@wdio/logger';
import {
    clearInterval, setTimeout, clearTimeout, setInterval,
} from 'node:timers';

/**
 * @class
 */
export default class Shipment {
    port = 6969;

    logger = logger('wdio-py-service');

    timeout = 20e3;

    cwd = process.cwd();

    /**
     * @type {ChildProcess}
     */
    pyProcess;

    /**
     *
     * @param {{port?: number, cwd: string, timeout: number}} options
     *  Options for Shipping the test results
     */
    constructor(options) {
        this.port = options.port ?? this.port;
        this.cwd = options.cwd ?? this.cwd;
        this.timeout = options.timeout ?? this.timeout;
    }

    get url() {
        return `http://127.0.0.1:${this.port}`;
    }

    async onPrepare() {
        const path = join('venv', 'Scripts', 'activate');
        const { cwd } = this;

        this.pyProcess = spawn(`"${path}" && sanic app:app --port ${this.port} --workers 2`, { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'] }, { cwd });

        this.pyProcess.stdout.on('data', (data) => this.logger.info(data?.toString()));
        this.pyProcess.stderr.on('data', (data) => this.logger.warn(data?.toString()));

        this.pyProcess.on('error', (err) => { throw new Error(String(err)); });
        this.pyProcess.on('exit', (code) => { throw new Error(`Failed to generate the report, Error Code: ${code}`); });

        this.logger.warn(`pid: ${this.pyProcess.pid}`);

        process.on('exit', async () => { await this.forceKill(); });
    }

    async onComplete() {
        const completed = this.pyProcess.killed || (await fetch(`${this.url}/setLastWave`, { method: 'POST' })).status !== 200;
        if (completed) return this.pyProcess.exitCode === 0;

        return this.flagToPyThatsItsDone();
    }

    async forceKill() {
        if (this.pyProcess.killed) return;
        if ((await fetch(`${this.url}/`)).status === 200) { this.pyProcess.kill('SIGINT'); }
    }

    async sayBye() {
        if (this.pyProcess.killed) return;
        await fetch(`${this.url}/bye`, { method: 'POST' });
    }

    async flagToPyThatsItsDone() {
        const explain = new Error('Sorry, could not generate report on time, please increase the timeout.');
        return new Promise((resolve, reject) => {
            const bomb = setTimeout(() => {
                this.logger.error('Failed to generate report on time');
                reject(explain);
            }, this.timeout + 5e3); // 5 seconds buffer

            const timer = setInterval(() => {
                this.logger.warn('Waiting for the py-process to complete...');

                fetch(`${this.url}/isItDone`).then((data) => data.json()).then(
                    (data) => {
                        if (!data.done) return;

                        clearTimeout(bomb);
                        clearInterval(timer);
                        resolve();
                    },
                );
            }, 1e3);
        }).then(async () => {
            this.logger.info('Killed the process...');
            await this.sayBye();
        });
    }

    continueWhenStarted(resolve, reject) {
        const bomb = setTimeout(() => {
            this.logger.error("waited for 5s for the server to start, but it didn't 😢");
            reject();
        }, 5e3);

        const timeout = setInterval(() => {
            this.logger.log('Waiting for the py-server to start...');

            fetch(`${this.url}/`).then((response) => {
                const passed = response.status === 200;

                if (!passed) return;
                clearInterval(timeout);
                clearTimeout(bomb);
                resolve();
            }, 500);
        });
    }
}
