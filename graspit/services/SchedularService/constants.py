from enum import StrEnum


class JobType(StrEnum):
    INIT_CONNECTION_JOBS = "set-db-connection-add-jobs"
    LOOKUP_JOB = "pending-tasks"
    MODIFY_SUITE = "fix-suite"
    MODIFY_TEST_RUN = "fix-test-run"
    EXECUTOR = "executor"
