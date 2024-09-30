from datetime import datetime
from handshake.reporters.reporter import CommonReporter, to_acceptable_date_format
from handshake.services.DBService.models.types import (
    PydanticModalForCreatingTestRunConfigBase,
    MarkTestRun,
    RunStatus,
    SuiteType,
)
from pytest import Session, Item, ExitCode, TestReport
from platform import platform
from typing import Optional
from threading import Lock


class PyTestHandshakeReporter(CommonReporter):
    def __init__(self):
        super().__init__()
        self.identified_parent = dict()
        self.check_if_parents_are = Lock()
        self.passed = 0
        self.started_at = None

    def create_session(self, started: datetime):
        super().create_session(started)
        self.started_at = started

    def put_test_config(self):
        return self.add_run_config(
            PydanticModalForCreatingTestRunConfigBase(
                framework="pytest",
                platform=platform(),
                avoidParentSuitesInCount=True,  # since we are counting packages as suites
            )
        )

    def create_test_entity(self, item: Item, is_suite: bool = False):
        path = item.path.relative_to(item.session.startpath)
        path = str(path.parent if path.name == "__init__.py" else path)
        parent = None

        if item.parent.nodeid:
            parent = item.parent.nodeid
            with self.check_if_parents_are:
                create_parent = not self.identified_parent.get(parent, False)
            if create_parent:
                self.create_test_entity(item.parent, True)
                with self.check_if_parents_are:
                    self.identified_parent[item.parent.nodeid] = True

        self.register_test_entity(
            dict(
                file=path,
                title=item.name,
                suiteType=SuiteType.SUITE if is_suite else SuiteType.TEST,
                parent="",
                is_processing=False,
                session_id="",
            ),
            item.nodeid,
            parent,
        )

    def update_test_entity_details(
        self, report: Optional[TestReport] = None, node_id: Optional[str] = None
    ):
        if not report:
            return self.update_test_entity(
                dict(started=to_acceptable_date_format(datetime.now())),
                node_id,
                punch_in=True,
            )

        if report.when == "call":
            self.passed += int(report.passed)
            self.update_test_entity(
                dict(
                    duration=report.duration,  # it is in milliseconds
                    ended=to_acceptable_date_format(
                        datetime.fromtimestamp(report.stop)
                    ),
                    started=to_acceptable_date_format(
                        datetime.fromtimestamp(report.start)
                    ),
                    standing=report.outcome.upper(),
                    errors=(
                        [dict(name="", stack="", message=report.longreprtext)]
                        if report.failed
                        else []
                    ),
                ),
                report.nodeid,
            )

    def update_session(self, session: Session):
        ended = datetime.now()
        self.update_test_session(
            dict(
                ended=to_acceptable_date_format(ended),
                entityName="console",
                entityVersion="-",
                simplified="console",
                tests=session.testscollected,
                failed=session.testsfailed,
                passed=self.passed,
                skipped=(session.testscollected - (session.testsfailed + self.passed)),
                duration=(ended - self.started_at).total_seconds() * 1e3,
                hooks=0,
            )
        )

    def update_test_status(self, session: Optional[Session] = None, exitcode: int = 1):
        status: RunStatus = RunStatus.COMPLETED

        if session.shouldfail or session.shouldstop:
            status = RunStatus.EXPECTED_TO_FAIL
        elif session.exitstatus == ExitCode.INTERRUPTED:
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

    def mark_suites_for_processing(self):
        return self.postman.submit(
            self.ensure_mails,
            self.client.post,
            self.create_postfix("ScheduleSuites"),
            False,
        )
