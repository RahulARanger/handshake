from pytest import TestReport, Session, Collector, CollectReport
from time import sleep
from datetime import datetime
from handshake_pytest.reporter import PyTestHandshakeReporter

reporter = PyTestHandshakeReporter()


def pytest_sessionstart(session: Session):
    reporter.set_context(session.exitstatus == 0, reporter.results, reporter.port)
    reporter.start_collection(session.name)
    reporter.create_session(datetime.now())
    reporter.put_test_config(session)


def pytest_runtest_logreport(report: CollectReport):
    ...


def pytest_sessionfinish(session: Session, exitstatus: int):
    reporter.close_resources()


# def pytest_report_teststatus(report: TestReport):
