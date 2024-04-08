from enum import StrEnum


class JobType(StrEnum):
    INIT_CONNECTION_JOBS = "set-db-connection-add-jobs"
    LOOKUP_JOB = "pending-tasks"
    MODIFY_SUITE = "fix-suite"
    MODIFY_TEST_RUN = "fix-test-run"
    EXECUTOR = "say-bye-if-required"
    PRUNE_TASKS = "prune-tasks"
    DELETE_RUNS = "delete-runs"


writtenAttachmentFolderName = "Attachments"
exportAttachmentFolderName = "Import"

EXPORT_RUNS_PAGE_VERSION = "1"
EXPORT_RUNS_PAGE_FILE_NAME = "runs.json"

DASHBOARD_ZIP_FILE = "dashboard.zip"
