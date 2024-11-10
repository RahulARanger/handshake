from typing import TypedDict
from datetime import datetime
from handshake.services.DBService.models.enums import (
    Status,
    RunStatus,
)


class SummaryOfTestRun(TypedDict):
    testID: str
    passed: int
    failed: int
    skipped: int
    tests: int
    passedSuites: int
    failedSuites: int
    skippedSuites: int
    suites: int
    duration: int
    projectName: str
    exitCode: int
    status: RunStatus
    started: datetime
    ended: datetime
    retried: int
    standing: Status
