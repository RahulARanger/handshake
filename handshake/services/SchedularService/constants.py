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

EXPORT_RUNS_PAGE_FILE_NAME = "runs.json"
EXPORT_RUN_PAGE_FILE_NAME = "run.json"
EXPORT_SUITE_PAGE_FILE_NAME = "suite.json"
EXPORT_PROJECTS_FILE_NAME = "projects.json"
EXPORT_OVERVIEW_PAGE = "overview.json"
EXPORT_ALL_SUITES = "suites.json"
EXPORT_SUITE_TESTS_PAGE = "tests.json"
EXPORT_TEST_ASSERTIONS = "assertions.json"
EXPORT_TEST_ENTITY_ATTACHMENTS = "entity-attachments.json"
EXPORT_TEST_RUN_ATTACHMENTS = "test-run-attachments.json"
