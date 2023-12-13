export interface RegisterSession {
  retried: number;
  started: Date;
  specs: string[];
}

export type SuiteType = 'SUITE' | 'TEST';
export type Standing = 'PASSED' | 'FAILED' | 'SKIPPED' | 'PENDING' | 'YET_TO_CALC';

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
  standing: Standing;
  ended: string;
}

export interface MarkTestSession {
  ended: string;
  duration: number;
  sessionID: string;
  passed: number;
  failed: number;
  skipped: number;
  retried: number;
  hooks: number;
  standing: Standing;
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

export interface Attachment {
  entityID: string;
  title?: string;
  description?:string;
  value:string;
  type: 'DESC' | 'LINK' | 'PNG' | 'ASSERT'
}
