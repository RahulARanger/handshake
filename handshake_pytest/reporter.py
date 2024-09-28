from datetime import datetime
from handshake.reporter import CommonReporter
from handshake.services.DBService.models.types import (
    PydanticModalForCreatingTestRunConfigBase,
    MarkSession,
    MarkTestRun,
    RunStatus,
    CreatePickedSuiteOrTest,
    SuiteType,
)
from pytest import Session, Item, ExitCode
from platform import platform
from typing import Optional
from concurrent.futures import ThreadPoolExecutor
from loguru import logger


class PyTestHandshakeReporter(CommonReporter):
    def __init__(self):
        super().__init__()
        self.identified_parent = dict()

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

    def update_test_status(self, session: Optional[Session] = None, exitcode: int = 1):
        status: RunStatus = RunStatus.COMPLETED

        if session.shouldfail:
            status = RunStatus.EXPECTED_TO_FAIL
        elif session.shouldstop or session.exitstatus == ExitCode.INTERRUPTED:
            status = RunStatus.INTERRUPTED
        elif session.exitstatus == ExitCode.INTERNAL_ERROR:
            status = RunStatus.INTERRUPTED
        force_call = status == RunStatus.INTERRUPTED

        if force_call:
            self.skip = True
            self.force_wait()

        self.update_test_run(
            MarkTestRun(exitCode=exitcode, status=status), force_call=force_call
        )
        return force_call

    def create_test(self, item: Item):
        self.register_test_suite(
            dict(
                file=str(item.path.relative_to(item.session.startpath)),
                title=item.name,
                suiteType=SuiteType.TEST,
                parent="",
                is_processing=False,
                session_id="",
            )
        )
