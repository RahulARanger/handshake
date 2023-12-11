import { join, dirname } from 'node:path';

export default class DialPad {
  port: number;

  exePath: string;

  static get defaultExe() {
    return join(dirname(__dirname), 'bin', 'handshake');
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
