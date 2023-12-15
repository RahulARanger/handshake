import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export default class DialPad {
  port: number;

  exePath: string;

  static get defaultExe() {
    const currentDir = typeof __dirname !== 'undefined'
      ? __dirname
      : dirname(fileURLToPath(import.meta.url));

    return join(dirname(currentDir), 'bin', 'handshake');
  }

  constructor(port: number, exePath?:string) {
    this.port = port; this.exePath = exePath ?? DialPad.defaultExe;
  }

  get url(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  get saveUrl(): string {
    return `${this.url}/save`;
  }

  get writeUrl(): string {
    return `${this.url}/write`;
  }
}
