from enum import StrEnum

FIND_SUITE_FOR_TASK = "find-yet-to-calc-suite-task"
MODIFY_SUITE_JOB = "modify-job-suite-"
FIX_OLD_RECORDS = "fix-old-records"


class JobType(StrEnum):
    LOOKUP_JOB = "pending-tasks"
    MODIFY_SUITE = "fix-suite"
    MODIFY_TEST_RUN = "fix-test-run"
