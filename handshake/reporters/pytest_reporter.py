from datetime import datetime
from handshake.reporters.reporter import CommonReporter, to_acceptable_date_format
from handshake.services.DBService.models.types import (
    PydanticModalForCreatingTestRunConfigBase,
    MarkTestRun,
    AttachmentType,
    Tag,
)
from handshake.services.DBService.models.enums import (
    LogType,
    RunStatus,
    SuiteType,
    Status,
)
from handshake.reporters.markers import meta_data_mark
from pytest import Session, Item, ExitCode, TestReport
from platform import platform
from typing import Optional, Dict, Any, List
from threading import Lock
from enum import StrEnum
from _pytest.fixtures import FixtureDef, FixtureValue, SubRequest
from _pytest.nodes import Node
from pathlib import Path


def relative_from_session_parent(session: Session, take_relative_for: Path):
    if not take_relative_for.is_relative_to(session.startpath.parent):
        return None
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
        self.identified_parent = dict()
        self.check_if_parents_are = Lock()
        self.mark_point = Lock()
        self.passed = 0
        self.started_at = None
        self.attachments: List[Dict[str, Any]] = []
        self.fixtures = {}
        self.func_args = {}

    def parse_config(self, session: Session):
        unregister = session.config.inicfg.get("disable_handshakes")
        if unregister:
            handshake_plugin = session.config.pluginmanager.get_plugin("handshakes")
            session.config.pluginmanager.unregister(handshake_plugin)
            return True

        rel_path = session.config.inicfg.get("save_results_in")
        port = session.config.inicfg.get("handshake_port")
        config_path = session.config.inicfg.get("save_handshake_config_dir")
        rel_to = Path(session.config.inipath.parent)

        self.set_context(
            True,
            (rel_to / rel_path).resolve() if rel_path else self.results,
            port if port else self.port,
            (rel_to / config_path).resolve() if config_path else None,
        )

    def create_session(self, started: datetime):
        super().create_session(started)
        self.started_at = started

    def put_test_config(self, config: dict[str, str | list[str]]):
        test_run_tag_prefix = "handshake_tag_"

        tags = []
        for key_desc, value in config.items():
            if not key_desc.startswith(test_run_tag_prefix):
                continue
            v = value
            if type(value) != str:
                v = str(value) or repr(value)
                logger.warning("Expected {} to of string type but found {} hence saving it as {}", value, type(value), v)
            tags.append(Tag(label=v, desc=key_desc[len(test_run_tag_prefix) :]))

        return self.add_run_config(
            PydanticModalForCreatingTestRunConfigBase(
                framework="pytest",
                platform=platform(),
                tags=tags,
                avoidParentSuitesInCount=False,  # since we are counting packages as suites
            )
        )

    def get_key(self, node_id: str, method: Optional[str] = "call"):
        return self.note[key(node_id, method)]

    def set_key(self, node_id: str, value: str, method: Optional[str] = "call"):
        self.note[key(node_id, method)] = value

    def create_test_entity(
        self,
        item: Node,
        is_suite: bool = False,
        helper_entity: Optional[PointToAtPhase] = None,
    ):
        path_obj: Path = relative_from_session_parent(item.session, item.path)
        if path_obj is None:
            return

        if helper_entity:
            with self.mark_point:
                self.pointing_to = key(item.nodeid, helper_entity)

        path_obj = path_obj.parent if path_obj.name == "__init__.py" else path_obj
        path: str = str(path_obj)
        parent = key(item.nodeid) if helper_entity else None

        if (
            helper_entity is None
            and item.parent.nodeid
            and not Path(item.parent.path).is_dir()
        ):
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
        marker = not helper_entity and item.get_closest_marker(meta_data_mark)
        meta = marker.kwargs if marker else {}
        tags = []

        for tag in item.own_markers if not helper_entity else tags:
            if tag.name == meta_data_mark:  # if it is our tag, we ignore it
                continue
            desc = ("" if not tag.args else f"args: {tag.args} and ") + (
                "kwargs: {}" if not tag.kwargs else f"kwargs: {tag.kwargs}"
            )
            tags.append(dict(label=tag.name, desc=desc))

        title = ""
        description = ""

        if hasattr(item, "callspec"):
            if hasattr(item.callspec, "id"):
                meta_obj = meta.get(item.callspec.id, dict())
                title = meta_obj.get("title")
                description = meta_obj.get("description")

        title = title or meta.get(title, item.name)
        description = description or meta.get("description", "")

        self.register_test_entity(
            dict(
                file=path,
                title=title,
                description=description,
                suiteType=helper_entity.upper() if helper_entity else suite_type,
                parent="",
                is_processing=helper_entity is not None,
                session_id="",
                tags=tags,
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
        with self.mark_point:
            self.pointing_to = (
                key(node_id) if node_id else key(report.nodeid, report.when)
            )
        if not report:
            return self.update_test_entity(
                dict(started=to_acceptable_date_format(datetime.now())),
                key(node_id),
                punch_in=True,
            )

        # NOTE: there are test cases that are skipped before the test is called
        # we do not have a report for the call.
        # so we need to manually update for such
        # Hack: we assume setup call as usual test
        when = (
            PointToAtPhase.CALL
            if report.skipped and report.when == PointToAtPhase.SETUP
            else report.when
        )

        outcome = (
            (Status.XPASSED if report.passed else Status.XFAILED)
            if report.when == PointToAtPhase.CALL
            and report.keywords.get("xfail", 0) == 1
            else report.outcome
        ).upper()

        payload = dict(
            duration=report.duration * 1e3,  # it is in seconds
            ended=to_acceptable_date_format(datetime.fromtimestamp(report.stop)),
            started=to_acceptable_date_format(datetime.fromtimestamp(report.start)),
            standing=outcome,
            errors=(
                [dict(name="Error", stack="", message=report.longreprtext)]
                if report.failed
                else []
            ),
        )

        if report.skipped:
            self.add_log(
                LogType.INFO,
                key(report.nodeid),
                "Skipped!",
                report.longreprtext,
                tags=[dict(label="Reason", desc=repr(report.longrepr))],
            )

        match when:
            case PointToAtPhase.CALL:
                self.passed += int(report.passed)

        self.update_test_entity(
            payload,
            key(report.nodeid, when),
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

    def add_log(
        self,
        log_type: LogType,
        entity_id: str,
        title: str,
        description: str,
        tags: Optional[List[Tag]] = None,
    ):
        self.attachments.append(
            dict(
                type=AttachmentType.LOG,
                entity_id=entity_id,
                description=description,
                value=dict(type=log_type),
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

        if fixturedef.cached_result and fixturedef.cached_result[-1]:
            note_desc = (
                f"{request.fixturename}(scope: {request.scope}) failed to execute, "
                f"because of this error: {repr(fixturedef.cached_result[-1][1])}"
            )
        else:
            note_desc = f"{request.fixturename}(scope: {request.scope}) passed and it gave a result {str(fixturedef.cached_result[0])}"

        fixture_def = "A fixture provides a defined, reliable and consistent context for the tests"

        save_in = relative_from_session_parent(
            request.session,
            request.session.startpath if request.scope == "session" else request.path,
        )

        for add_in in self.fixtures.get(request.fixturename, set()):
            self.add_log(
                LogType.INFO,
                entity_id=add_in,
                title=request.fixturename,
                tags=[
                    dict(  # https://docs.pytest.org/en/stable/explanation/fixtures.html
                        label="fixture",
                        desc=fixture_def,
                    ),
                    dict(label=request.scope, desc=scope_desc),
                    dict(
                        label="saved in",
                        desc=str(save_in if save_in else request.session.startpath),
                    ),
                ],
                description=note_desc,
            )

        self.fixtures.get(request.fixturename, set()).clear()

    def add_test_assertion(self, node_id: str, title: str, message: str, passed: bool):
        with self.mark_point:
            value = dict(
                entity_id=key(node_id) if node_id else self.pointing_to,
                title=title,
                value=dict(passed=passed, wait=-1, interval=-1),
                type=AttachmentType.ASSERT,
                description=message,
            )
            return self.attachments.append(value)
