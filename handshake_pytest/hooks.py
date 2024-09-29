from pytest import Session, Item
from datetime import datetime
from handshake_pytest.reporter import PyTestHandshakeReporter

reporter = PyTestHandshakeReporter()


def pytest_sessionstart(session: Session):
    if reporter.parse_config(session):
        return
    reporter.start_collection(session.name)
    reporter.create_session(datetime.now())
    reporter.put_test_config()


def pytest_itemcollected(item: Item):
    reporter.create_test_entity(item)


def pytest_runtest_logstart(nodeid, location):
    reporter.update_test_entity_details(None, nodeid)


def pytest_runtest_logreport(report):
    reporter.update_test_entity_details(report)


def pytest_sessionfinish(session: Session, exitstatus: int):
    force_call = reporter.update_test_status(session, exitstatus)
    if not force_call:
        reporter.mark_suites_for_processing()
        reporter.update_session(session)
    reporter.close_resources()
