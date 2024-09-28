from pytest import TestReport, Session, Collector, CollectReport, Item
from datetime import datetime
from handshake_pytest.reporter import PyTestHandshakeReporter

reporter = PyTestHandshakeReporter()


def pytest_sessionstart(session: Session):
    reporter.parse_config(session)
    reporter.start_collection(session.name)
    reporter.create_session(datetime.now())
    reporter.put_test_config()


# def pytest_collectstart(collector: CollectReport):
#     print("here", collector)


# def pytest_collectreport(report: CollectReport):
#     print("here", report)


def pytest_sessionfinish(session: Session, exitstatus: int):
    reporter.close_resources(reporter.update_test_status(session, exitstatus))


def pytest_itemcollected(item: Item):
    reporter.create_test(item)
