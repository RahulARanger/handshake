from datetime import datetime
from handshake.reporters.reporter import CommonReporter, to_acceptable_date_format
from handshake.services.DBService.models.types import (
    PydanticModalForCreatingTestRunConfigBase,
    MarkTestRun,
    RunStatus,
    SuiteType,
    AttachmentType,
    Tag,
)
from pytest import Session, Item, ExitCode, TestReport
from platform import platform
from typing import Optional, Dict, Any, List, Callable
from threading import Lock
from enum import StrEnum
from _pytest.fixtures import FixtureDef, FixtureValue, SubRequest
from traceback import format_exception
from pathlib import Path


def relative_from_session_parent(session: Session, take_relative_for: Path):
    return take_relative_for.relative_to(session.startpath.parent)


class PointToAtPhase(StrEnum):
    CALL = "call"
    SETUP = "setup"
    TEARDOWN = "teardown"


def key(node_id: str, method: Optional[str] = "call"):
    return node_id + "-" + method


class PyTestHandshakeReporter(CommonReporter):
    def __init__(self):
        super().__init__()
        self.pointing_to: Optional[Item] = None
        self.pointing_to_phase: Optional[PointToAtPhase] = None
        self.identified_parent = dict()
        self.check_if_parents_are = Lock()
        self.passed = 0
        self.started_at = None
        self.attachments: List[Dict[str, Any]] = []
        self.fixtures = {}
        self.last_assertion_added = {}

    def create_session(self, started: datetime):
        super().create_session(started)
        self.started_at = started

    def put_test_config(self):
        return self.add_run_config(
            PydanticModalForCreatingTestRunConfigBase(
                framework="pytest",
                platform=platform(),
                avoidParentSuitesInCount=False,  # since we are counting packages as suites
            )
        )

    def get_key(self, node_id: str, method: Optional[str] = "call"):
        return self.note[key(node_id, method)]

    def set_key(self, node_id: str, value: str, method: Optional[str] = "call"):
        self.note[key(node_id, method)] = value

    def create_test_entity(
        self,
        item: Item,
        is_suite: bool = False,
        helper_entity: Optional[PointToAtPhase] = None,
    ):
        path = relative_from_session_parent(item.session, item.path)
        path = str(path.parent if path.name == "__init__.py" else path)
        parent = key(item.nodeid) if helper_entity else None

        if helper_entity is None and item.parent.nodeid:
            parent = key(item.parent.nodeid)
            with self.check_if_parents_are:
                create_parent = not self.identified_parent.get(
                    item.parent.nodeid, False
                )
            if create_parent:
                self.create_test_entity(item.parent, True)
                with self.check_if_parents_are:
                    self.identified_parent[item.parent.nodeid] = True

        suite_type = SuiteType.SUITE if is_suite else SuiteType.TEST

        self.register_test_entity(
            dict(
                file=path,
                title=item.name,
                suiteType=helper_entity.upper() if helper_entity else suite_type,
                parent="",
                is_processing=helper_entity is not None,
                session_id="",
            ),
            key(item.nodeid, helper_entity if helper_entity else PointToAtPhase.CALL),
            parent,
        )

        if is_suite:
            return

        if hasattr(item, "fixturenames"):
            for name in item.fixturenames:
                add_here = self.fixtures.get(name, set())
                add_here.add(
                    key(
                        item.nodeid,
                        helper_entity if helper_entity else PointToAtPhase.CALL,
                    )
                )
                self.fixtures[name] = add_here

    def update_test_entity_details(
        self, report: Optional[TestReport] = None, node_id: Optional[str] = None
    ):
        if not report:
            return self.update_test_entity(
                dict(started=to_acceptable_date_format(datetime.now())),
                key(node_id),
                punch_in=True,
            )

        self.pointing_to_phase = report.when
        payload = dict(
            duration=report.duration * 1e3,  # it is in seconds
            ended=to_acceptable_date_format(datetime.fromtimestamp(report.stop)),
            started=to_acceptable_date_format(datetime.fromtimestamp(report.start)),
            standing=report.outcome.upper(),
            errors=(
                [dict(name="", stack="", message=report.longreprtext)]
                if report.failed
                else []
            ),
        )

        match report.when:
            case PointToAtPhase.CALL:
                self.passed += int(report.passed)

        self.update_test_entity(
            payload,
            key(report.nodeid, report.when),
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
        elif (
            session.exitstatus == ExitCode.USAGE_ERROR
            or session.exitstatus == ExitCode.INTERNAL_ERROR
        ):
            status = RunStatus.INTERNAL_ERROR

        force_call = status == RunStatus.INTERRUPTED

        if force_call:
            self.skip = True
            self.force_wait()
        else:
            for _ in self.last_assertion_added.values():
                self.attachments.append(_)

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

    def add_note(
        self,
        entity_id: str,
        title: str,
        note_description: str,
        helpful_description: str = "",
        tags: Optional[List[Tag]] = None,
        **extraValues,
    ):
        self.attachments.append(
            dict(
                type=AttachmentType.NOTE,
                entity_id=entity_id,
                description=helpful_description,
                value=note_description,
                title=title,
                tags=tags or [],
            )
        )

    def note_fixture(self, fixturedef: FixtureDef[FixtureValue], request: SubRequest):
        if fixturedef.cached_result is None:
            return

        scope_desc = ""

        match request.scope:
            case "session":
                scope_desc = "Shared across all tests in the session."
            case "package":
                scope_desc = "Shared across tests in a package."
            case "function":
                scope_desc = "Created anew for each test function."
            case "class":
                scope_desc = "Shared among tests in a class."

        if fixturedef.cached_result[-1]:
            note_desc = f"{request.fixturename} failed to execute, because of this error: {format_exception(fixturedef.cached_result[-1][1])}"
        else:
            note_desc = f"{request.fixturename} passed and it gave a result {str(fixturedef.cached_result[0])}"

        fixture_def = "A fixture provides a defined, reliable and consistent context for the tests"

        save_in = relative_from_session_parent(
            request.session,
            request.session.startpath if request.scope == "session" else request.path,
        )

        for add_in in self.fixtures.get(request.fixturename, set()):
            self.add_note(
                entity_id=add_in,
                title=request.fixturename,
                tags=[
                    dict(  # https://docs.pytest.org/en/stable/explanation/fixtures.html
                        label="fixture",
                        desc=fixture_def,
                    ),
                    dict(label=request.scope, desc=scope_desc),
                ],
                note_description=note_desc,
                helpful_description=fixture_def,
                extraValues=dict(savedIn=str(save_in)),
            )

        self.fixtures.get(request.fixturename, set()).clear()

    def add_test_assertion(
        self, node_id: Optional[str], title: str, message: str, passed: bool
    ):
        value = dict(
            entity_id=key(node_id) if node_id else key(self.pointing_to.nodeid),
            title=title,
            value=dict(passed=passed, wait=-1, interval=-1),
            type=AttachmentType.ASSERT,
            description=message,
        )
        if not node_id:
            self.last_assertion_added[key(self.pointing_to.nodeid)] = value
            return

        if self.last_assertion_added.get(key(node_id)):
            self.last_assertion_added.pop(key(node_id))
        return self.attachments.append(value)
