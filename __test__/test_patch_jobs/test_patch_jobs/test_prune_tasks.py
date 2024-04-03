from pytest import mark
from handshake.services.DBService.models import (
    SuiteBase,
    RollupBase,
    SessionBase,
    RetriedBase,
    TaskBase,
    TestLogBase,
)
from subprocess import run
from handshake.services.DBService.models.enums import Status, LogType
from handshake.services.SchedularService.constants import JobType
from handshake.services.SchedularService.modifySuites import patchTestSuite
from handshake.services.SchedularService.register import (
    register_patch_suite,
)
from handshake.services.SchedularService.handlePending import patch_jobs
from tortoise.expressions import Q


class TestPruneTasks:
    def test_simple_prun(self):
        ...
