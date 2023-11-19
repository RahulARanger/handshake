export default class DialPad {
  port: number;

  exePath?: string;

  constructor(port: number, exePath?:string) { this.port = port; this.exePath = exePath; }

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
