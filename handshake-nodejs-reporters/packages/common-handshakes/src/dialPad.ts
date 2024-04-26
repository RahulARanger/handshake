export default class DialPad {
  port: number;

  exePath: string;

  static get defaultExe() {
    return 'handshake';
  }

  constructor(port: number) {
    this.port = Number.isNaN(port) ? 0 : port; this.exePath = DialPad.defaultExe;
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
