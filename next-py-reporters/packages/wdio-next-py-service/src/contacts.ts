import type { ServiceOptions } from "./types";

export default class ContactsForService {
	options: ServiceOptions = {};

	get url(): string {
		return `http://127.0.0.1:${this.options.port}`;
	}

	get updateRunConfig(): string {
		return `${this.url}/save/currentRun`;
	}
}
