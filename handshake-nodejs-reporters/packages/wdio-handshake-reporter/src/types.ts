export interface ReporterOptions {
  port: number;
  addScreenshots?:boolean;
  timeout?:number;
}
export interface HandshakeServiceOptions {
  port: number;
  root: string;
  exePath?:string;
  collectionName: string;
  timeout?: number;
  workers?:number;
  export?: {
    out?: string;
    maxTestRuns: number;
    skipPatch?: boolean;
  }
  testConfig: {
    projectName: string;
    avoidParentSuitesInCount?: boolean;
  }
}
