from enum import StrEnum, IntEnum


class MigrationStatus(StrEnum):
    PASSED = "PASSED"
    PENDING = "PENDING"
    FAILED = "FAILED"


class LogGeneratedBy(IntEnum):
    USER = 0
    API = 1
    SCHEDULER = 2


class MigrationTrigger(StrEnum):
    AUTOMATIC = "AUTO"
    CLI = "CLI"


class Status(StrEnum):
    PASSED = "PASSED"
    PENDING = "PENDING"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"
    YET_TO_CALCULATE = (
        "YET_TO_CALC"  # needs to be updated by our server to either passed or failed
    )
    # yet_to_calc is mostly seen for the suite
    RETRIED = "RETRIED"
    PROCESSING = "PROCESSING"
    XPASSED = "XPASSED"
    XFAILED = "XFAILED"


class RunStatus(StrEnum):
    COMPLETED = "COMPLETED"
    PENDING = "PENDING"
    INTERRUPTED = "INTERRUPTED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SKIPPED = "SKIPPED"  # not in use as of now
    EXPECTED_TO_FAIL = "EXPECTED_TO_FAIL"


class SuiteType(StrEnum):
    TEST = "TEST"
    SUITE = "SUITE"
    SETUP = "SETUP"
    TEARDOWN = "TEARDOWN"


class LogType(StrEnum):
    ERROR = "ERROR"
    WARN = "WARN"
    INFO = "INFO"


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
    NOTE = "NOTE"  # depreciated
    LOG = "LOG"


class LogDisplayType(StrEnum):
    SEPARATE = "SEPARATE"
    TOGETHER = "TOGETHER"


class ConfigKeys(StrEnum):
    maxRunsPerProject = "MAX_RUNS_PER_PROJECT"
    version = "VERSION"
    recentlyDeleted = "RECENTLY_DELETED"
    reset_test_run = "RESET_FIX_TEST_RUN"
