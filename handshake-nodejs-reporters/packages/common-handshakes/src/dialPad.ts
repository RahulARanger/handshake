export default class DialPad {
  port: number;

  exePath: string;

  disabled: boolean;

  static get defaultExe() {
    return 'handshake';
  }

  constructor(port: number, disabled?:boolean) {
    this.port = port; this.exePath = DialPad.defaultExe;
    this.disabled = disabled || false;
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
