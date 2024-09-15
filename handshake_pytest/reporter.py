from datetime import datetime
from handshake.reporter import CommonReporter
from handshake.services.DBService.models.types import (
    PydanticModalForCreatingTestRunConfigBase,
    MarkSession,
    MarkTestRun,
    RunStatus,
)
from pytest import Session
from platform import platform


class PyTestHandshakeReporter(CommonReporter):
    def put_test_config(self):
        return self.add_run_config(
            PydanticModalForCreatingTestRunConfigBase(
                framework="pytest",
                platform=platform(),
            )
        )

    def update_session(self, session: Session):
        self.update_test_session(
            MarkSession(
                ended=datetime.now(),
                entityName="console",
                entityVersion="-",
                simplified="console",
                tests=session.testscollected,
                failed=session.testsfailed,
                passed=0,
                skipped=0,
                hooks=0,
            )
        )

    def update_test_status(self, session: Session, exitcode: int):
        status: RunStatus = RunStatus.COMPLETED

        if session.shouldfail:
            status = RunStatus.EXPECTED_TO_FAIL
        elif session.shouldstop:
            status = RunStatus.INTERRUPTED

        self.update_test_run(MarkTestRun(exitCode=exitcode, status=status))
