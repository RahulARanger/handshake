export interface RegisterSession {
  retried: number;
  started: string;
  specs: string[];
}

export type SuiteType = 'SUITE' | 'TEST';

export interface RegisterTestEntity {
  title: string;
  description: string;
  file: string;
  tags: Array<{ astNodeId: string, name: string }>;
  started: string;
  suiteType: SuiteType;
  parent: string;
  session_id: string;
  retried: number;
}

export interface MarkTestEntity {
  duration: number;
  suiteID: string;
  errors: Error[];
  standing: string;
}

export interface MarkTestSession {
  ended: string;
  duration: number;
  sessionID: string;
  passed: number;
  failed: number;
  skipped: number;
  hooks: number;
  tests: number;
  entityName: string;
  entityVersion: string;
  simplified: string;
}

export interface UpdateTestRunConfig {
  maxInstances?:number;
  framework:string;
  platformName: string;
  exitCode:number;
  fileRetries:number;
  saveOptions: object;
  avoidParentSuitesInCount: boolean;
}

export interface Assertion {
  matcherName: string;
  expected: any;
  options: any;
}
