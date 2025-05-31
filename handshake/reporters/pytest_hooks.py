from pytest import Session, Item, Parser
from _pytest.fixtures import FixtureDef, FixtureValue, SubRequest
from datetime import datetime
from loguru import logger
from handshake.services.DBService.lifecycle import log_less
from handshake.reporters.pytest_reporter import PyTestHandshakeReporter, PointToAtPhase

reporter = PyTestHandshakeReporter()


def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "test_metadata(title: str, description: str): Attach metadata to handshake like title and description to tests.",
    )


def pytest_addoption(parser: Parser):
    parser.addini(
        "save_results_in",
        "saves the test results [db file] in the give path [note this is not where the html export would be generated]",
        type="string",
    )
    parser.addini(
        "save_handshake_config_dir",
        "saves the handshake configuration in this path, once generated. you can configure the reporter",
        type="string",
    )
    parser.addini(
        "disable_handshakes",
        "disable handshake reporter, set it as either 1/true or false",
        type="bool",
    )
    parser.addini(
        "handshake_port",
        "port number that handshake should use to collect test results",
        type="string",
    )


def pytest_sessionstart(session: Session):
    if reporter.parse_config(session):
        return
    is_quiet = session.config.getoption("q", session.config.getoption("quiet", False))
    if is_quiet:
        log_less()

    reporter.start_collection(
        session.config.inicfg.get("projectName") or session.path.name, is_quiet
    )
    reporter.create_session(datetime.now())
    reporter.put_test_config(session.config.inicfg)


def pytest_itemcollected(item: Item):
    reporter.create_test_entity(item)


def pytest_runtest_logstart(nodeid, location):
    reporter.update_test_entity_details(None, nodeid)


def pytest_runtest_setup(item: Item):
    reporter.create_test_entity(item, helper_entity=PointToAtPhase.SETUP)


def pytest_runtest_call(item: Item):
    reporter.func_args[item.nodeid] = item.funcargs


def pytest_runtest_logreport(report):
    reporter.update_test_entity_details(report)


def pytest_runtest_teardown(item: Item, nextitem: Item):
    reporter.create_test_entity(item, helper_entity=PointToAtPhase.TEARDOWN)


#
def pytest_assertion_pass(item, lineno, orig, expl):
    try:
        reporter.add_test_assertion(item.nodeid, orig, expl, True)
    except Exception:
        logger.exception("Unable to add test assertion")


def pytest_fixture_post_finalizer(
    fixturedef: FixtureDef[FixtureValue], request: SubRequest
):
    reporter.note_fixture(fixturedef, request)


def pytest_sessionfinish(session: Session, exitstatus: int):
    force_call = reporter.update_test_status(session, exitstatus)
    if not force_call:
        reporter.mark_suites_for_processing()
        reporter.update_session(session)
    reporter.close_resources()
