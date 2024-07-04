from enum import StrEnum
from typing import Tuple


class MigrationStatus(StrEnum):
    PASSED = "PASSED"
    PENDING = "PENDING"
    FAILED = "FAILED"


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


class LogDisplayType(StrEnum):
    SEPARATE = "SEPARATE"
    TOGETHER = "TOGETHER"


class PrunedRecords(StrEnum):
    RUN = "RUN"


class ConfigKeys(StrEnum):
    maxRunsPerProject = "MAX_RUNS_PER_PROJECT"
    version = "VERSION"
    recentlyDeleted = "RECENTLY_DELETED"
    reset_test_run = "RESET_FIX_TEST_RUN"
