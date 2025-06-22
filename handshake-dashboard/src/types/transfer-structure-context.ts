import type { statusOfEntity } from './session-records';

export interface StatusContext {
    passed: number;
    failed: number;
    skipped: number;
    status: statusOfEntity;
    title: string;
    isPath?: boolean;
    isFile?: boolean;
}
