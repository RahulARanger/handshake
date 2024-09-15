from pytest import TestReport, Session, Collector, CollectReport
from datetime import datetime
from handshake_pytest.reporter import PyTestHandshakeReporter

reporter = PyTestHandshakeReporter()


def pytest_sessionstart(session: Session):
    reporter.set_context(session.exitstatus == 0, reporter.results, reporter.port)
    reporter.start_collection(session.name)
    reporter.create_session(datetime.now())
    reporter.put_test_config()


# def pytest_collectstart(collector: CollectReport):
#     print("here", collector)


# def pytest_collectreport(report: CollectReport):
#     print("here", report)


def pytest_sessionfinish(session: Session, exitstatus: int):
    reporter.update_test_status(session, exitstatus)
    reporter.close_resources()


#

# def pytest_report_teststatus(report: TestReport):
