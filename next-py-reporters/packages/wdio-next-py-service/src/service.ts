import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import type { Readable } from "node:stream";
import { join } from "node:path";
import {
	clearInterval,
	setTimeout,
	clearTimeout,
	setInterval,
} from "node:timers";
import { existsSync, mkdirSync } from "node:fs";
import logger from "@wdio/logger";
import fetch from "node-fetch";
import type { Capabilities, Options, Services } from "@wdio/types";
import type { ServiceOptions } from "./types";
import ContactsForService from "./contacts";

ContactsForService;

export default class NeXtPyService
	extends ContactsForService
	implements Services.ServiceInstance
{
	logger = logger("wdio-py-service");
	pyProcess?: ChildProcess;
	patcher?: ChildProcess;

	constructor(options: ServiceOptions) {
		super();
		this.options = options;
	}

	get resultsDir(): string {
		return join(
			this.options.root ?? process.cwd(),
			this.options.collectionName ?? "Test Results"
		);
	}

	get venv(): string {
		return join("venv", "Scripts", "activate");
	}

	onPrepare() // config: Options.Testrunner,
	// capabilities: Capabilities.RemoteCapabilities
	: void {
		const { root: rootDir, port, projectName } = this.options;
		this.logger.info("Starting py-process 🚚...");
		const resultsDir = this.resultsDir;

		if (!existsSync(resultsDir)) {
			mkdirSync(resultsDir);
		}

		const command = `"${this.venv}" && next-py run-app ${projectName} "${resultsDir}" -p ${port} -w 2`;
		this.pyProcess = spawn(command, {
			shell: true,
			stdio: ["ignore", "pipe", "pipe"],
			cwd: rootDir,
		});

		const [stdout, stderr] = [
			this.pyProcess.stdout,
			this.pyProcess.stderr,
		] as ReadableStream[];

		stdout.on("data", (data: Buffer) => {
			this.logger.info(`ℹ️ - ${data.toString()}`);
		});
		stderr.on("data", (data: Buffer) => {
			this.logger.warn(`${data.toString()}`);
		});
		this.pyProcess.on("error", (err: Buffer) => {
			throw new Error(String(err));
		});

		this.pyProcess.on("exit", (code) => {
			if (code !== 0)
				this.logger.error(
					`next-py-server was force closed 😫, found exit code: ${code}`
				);
		});

		this.logger.info(
			`Started py-process, running 🐰 at pid: ${this.pyProcess.pid}`
		);

		// important for avoiding zombie py server
		// eslint-disable-next-line @typescript-eslint/no-misused-promises -- not sure how to solve this
		process.on("exit", async () => {
			this.patcher?.kill("SIGINT");
			await this.sayBye();
		});
	}

	async onWorkerStart(): Promise<unknown> {
		await Promise.resolve(this.waitUntilItsReady.bind(this)());
		return {};
	}

	async forceKill(): Promise<unknown> {
		if (this.pyProcess?.killed) return;
		if ((await fetch(`${this.url}/`)).status === 200) {
			await this.sayBye();
			this.pyProcess?.kill("SIGINT");
			this.logger.warn("→ Had to 🗡️ the py-process.");
		}
		return {};
	}

	async sayBye(): Promise<unknown> {
		if (this.pyProcess?.killed) {
			this.logger.warn("🙀 next-py-process was already terminated.");
			return;
		}

		const results = [];
		for (let worker = 0; worker < 2; worker += 1) {
			this.logger.info("📞 Requesting for worker termination");
			results.push(
				fetch(`${this.url}/bye`, { method: "POST" }).catch(() => {
					this.logger.info("Terminated.");
				})
			);
		}
		await Promise.all(results);

		this.logger.info("→ Py Process was closed 😪");
		return {};
	}

	async waitUntilItsReady(): Promise<unknown> {
		const waitingForTheServer = new Error(
			"Not able to connect with server within 10 seconds 😢, please try again later"
		);

		return new Promise((resolve, reject) => {
			const bomb = setTimeout(() => {
				reject(waitingForTheServer);
			}, 10e3);

			const timer = setInterval(() => {
				this.logger.warn("pinging py-server 👆...");

				fetch(`${this.url}/`)
					.then((resp) => {
						if (resp.status !== 200) return;
						clearTimeout(bomb);
						clearInterval(timer);

						this.logger.info("Server is online! 😀");
						resolve({});
					})
					.catch(() => {
						this.logger.warn("😓 Server has not started yet...");
					});
			}, 3e3);
		}).catch(this.sayBye.bind(this));
	}

	async flagToPyThatsItsDone(): Promise<void> {
		// closing next-py server for now.
		await this.sayBye();

		const reportError = new Error(
			"Failed to generate Report on time 😢, please note the errors if any seen."
		);
		this.patcher = spawn(
			`"${this.venv}" && next-py patch "${this.resultsDir}"`,
			{
				shell: true,
				cwd: this.options.root,
				stdio: ["ignore", "pipe", "pipe"],
			}
		);

		return new Promise((resolve, reject) => {
			const bomb = setTimeout(() => {
				if (!this.patcher?.killed) this.patcher?.kill("SIGINT");
				reject(reportError);
			}, this.options.timeout);
			this.patcher?.on("exit", (exitCode) => {
				clearTimeout(bomb);

				if (exitCode !== 0) {
					const stdout = this.patcher?.stdout?.read() as Buffer;
					const stderr = this.patcher?.stderr?.read() as Buffer;

					this.logger.warn(stdout.toString());
					this.logger.error(stderr.toString());

					reject(reportError);
					return;
				}
				this.logger.info(
					"Results are patched 🤩. Now we are ready to export it."
				);
				resolve();
			});
		});
	}

	async onComplete(
		exitCode: number,
		config: Options.Testrunner
		// capabilities: Capabilities.RemoteCapabilities
	): Promise<unknown> {
		const cap = config.capabilities as Capabilities.DesiredCapabilities;
		const platformName = String(cap.platformName);

		const resp = await fetch(this.updateRunConfig, {
			method: "PUT",
			body: JSON.stringify({
				maxTestRuns: 100,
				platformName,
			}),
		});
		this.logger.info(
			`Updated config 🐰 for the test run: ${await resp.text()}`
		);
		const completed = this.pyProcess?.killed;
		if (completed) return this.pyProcess?.exitCode === 0;

		await fetch(`${this.url}/done`, { method: "PUT" }).then(
			async (data) => {
				this.logger.info(await data.text());
			}
		);
		return this.flagToPyThatsItsDone();
	}
}
