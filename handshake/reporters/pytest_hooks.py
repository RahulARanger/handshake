from pytest import Session, Item
from datetime import datetime
from handshake.reporters.pytest_reporter import PyTestHandshakeReporter

reporter = PyTestHandshakeReporter()


def pytest_sessionstart(session: Session):
    if reporter.parse_config(session):
        return
    reporter.start_collection(session)
    reporter.create_session(datetime.now())
    reporter.put_test_config()


def pytest_itemcollected(item: Item):
    reporter.create_test_entity(item)


def pytest_runtest_logstart(nodeid, location):
    reporter.update_test_entity_details(None, nodeid)


def pytest_runtest_logreport(report):
    reporter.update_test_entity_details(report)


# def pytest_assertrepr_compare(config, op, left, right):
#     print(config, op, left, right)
#
#
# def pytest_assertion_pass(item, lineno, orig, expl):
#     print(item, lineno, orig, expl)
#
#
# def pytest_exception_interact(node, call, report):
#     print(node, call, report)


def pytest_sessionfinish(session: Session, exitstatus: int):
    force_call = reporter.update_test_status(session, exitstatus)
    if not force_call:
        reporter.mark_suites_for_processing()
        reporter.update_session(session)
    reporter.close_resources()
