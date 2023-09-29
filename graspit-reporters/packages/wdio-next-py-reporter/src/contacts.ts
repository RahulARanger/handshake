import WDIOReporter from "@wdio/reporter";
import type { ReporterOptions } from "./types";

// eslint-disable-next-line import/no-mutable-exports -- port is used by user to send requests to server so it is mutable
export let port: undefined | number;

export class ReporterContacts extends WDIOReporter {
	options: ReporterOptions = {};

	constructor(options: ReporterOptions) {
		super(options);
		this.options = options;
		port = options.port;
	}

	get url(): string {
		return `http://127.0.0.1:${this.options.port}`;
	}

	get saveUrl(): string {
		return `${this.url}/save`;
	}

	get addFeatureUrl(): string {
		return `${this.saveUrl}/addFeature`;
	}

	get addSuiteUrl(): string {
		return `${this.saveUrl}/addSuite`;
	}

	get registerSession(): string {
		return `${this.saveUrl}/registerSession`;
	}

	get registerSuite(): string {
		return `${this.saveUrl}/registerSuite`;
	}

	get updateSuite(): string {
		return `${this.saveUrl}/updateSuite`;
	}

	get updateSession(): string {
		return `${this.saveUrl}/updateSession`;
	}
}
