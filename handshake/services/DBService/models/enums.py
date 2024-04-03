from enum import StrEnum


class Status(StrEnum):
    PASSED = "PASSED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"
    PENDING = "PENDING"
    YET_TO_CALCULATE = (
        "YET_TO_CALC"  # needs to be updated by our server to either passed or failed
    )
    # yet_to_calc is mostly seen for the suite
    RETRIED = "RETRIED"


class SuiteType(StrEnum):
    TEST = "TEST"
    SUITE = "SUITE"


class AttachmentType(StrEnum):
    LABEL = "LABEL"
    ENV = "ENV"
    CONFIG = "CONFIG"
    VIDEO = "VIDEO"
    PNG = "PNG"
    DESC = "DESC"
    IMG = "IMAGE"
    LINK = "LINK"
    ASSERT = "ASSERT"


class LogType(StrEnum):
    ERROR = "ERROR"
    WARN = "WARN"
    INFO = "INFO"


class PrunedRecords(StrEnum):
    RUN = "RUN"


class ConfigKeys(StrEnum):
    maxRunsPerProject = "MAX_RUNS_PER_PROJECT"
    version = "VERSION"
    recentlyDeleted = "RECENTLY_DELETED"
    reset_test_run = "RESET_FIX_TEST_RUN"
    py_version = "PY_VERSION"
    last_patch = "LAST_PATCH"
    last_migration = "LAST_MIGRATION"
