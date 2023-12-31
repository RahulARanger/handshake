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
    ERROR = "ERROR"
    WARN = "WARN"
    INFO = "INFO"


class PrunedRecords(StrEnum):
    RUN = "RUN"


class ConfigKeys(StrEnum):
    maxRuns = "MAX_RUNS"
    version = "VERSION"
    recentlyDeleted = "RECENTLY_DELETED"
