export interface ReporterOptions {
  port: number;
  addScreenshots?:boolean;
}
export interface GraspItServiceOptions {
  port: number;
  root: string;
  exePath?:string;
  collectionName: string;
  timeout?: number;
  projectName: string;
  export?: {
    out?: string;
    maxTestRuns: number;
    isDynamic?: boolean;
    skipPatch?: boolean;
  }
}

export interface Assertion {
  matcherName: string;
  expected: any;
  options: any;
}
