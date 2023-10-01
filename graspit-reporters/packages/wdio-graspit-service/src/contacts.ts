import type { GraspItServiceOptions } from './types';

export default class ContactsForService {
  options: GraspItServiceOptions = {};

  get url(): string {
    return `http://127.0.0.1:${this.options.port}`;
  }

  get updateRunConfig(): string {
    return `${this.url}/save/currentRun`;
  }
}
