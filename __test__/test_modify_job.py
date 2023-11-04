import datetime
from pytest import mark
from graspit.services.DBService.models import SuiteBase, RollupBase
from graspit.services.DBService.models.enums import SuiteType, Status
from graspit.services.SchedularService.modifySuites import patchTestSuite
from graspit.services.SchedularService.register import register_patch_suite


@mark.usefixtures("sample_test_session")
class TestModifyJob:
    async def test_empty_suite(self, sample_test_session):
        session = await sample_test_session
        test_id = session.test_id

        session_id = str(session.sessionID)

        parent_suite = await SuiteBase.create(
            session_id=session_id,
            suiteType=SuiteType.SUITE,
            started=datetime.datetime.now().isoformat(),
            title="suite-parent",
            standing=Status.YET_TO_CALCULATE,
            file="test-1.js",
            parent="",
        )
        parent_id = str(parent_suite.suiteID)

        await register_patch_suite(parent_id, test_id)
        await patchTestSuite(parent_suite.suiteID, test_id)

        # if there are no test entities it won't make any change
        record = await RollupBase.filter(suite_id=parent_suite.suiteID).first()
        assert record.passed == record.failed == record.tests == record.skipped == 0
        await record.delete()

        parent_suite = await SuiteBase.filter(suiteID=parent_suite.suiteID).first()
        assert parent_suite.standing == Status.PASSED
        assert (
            parent_suite.passed
            == parent_suite.failed
            == parent_suite.skipped
            == parent_suite.tests
            == 0
        ), "Patching any empty suite has 0s with passed as status"

    async def test_rollup_values(self, sample_test_run, sample_test_session):
        session = await sample_test_session
        test_id = session.test_id

        session_id = str(session.sessionID)

        parent_suite = await SuiteBase.create(
            session_id=session_id,
            suiteType=SuiteType.SUITE,
            started=datetime.datetime.now().isoformat(),
            title="suite-parent",
            standing=Status.YET_TO_CALCULATE,
            file="test-1.js",
            parent="",
        )

        parent_id = str(parent_suite.suiteID)

        suite = await SuiteBase.create(
            session_id=session_id,
            suiteType=SuiteType.SUITE,
            started=datetime.datetime.now().isoformat(),
            title="suite-1",
            standing=Status.YET_TO_CALCULATE,
            file="test-1.js",
            parent=parent_id,
        )

        suite_id = str(suite.suiteID)

        for test in range(3):
            for _ in (Status.PASSED, Status.FAILED, Status.SKIPPED):
                await SuiteBase.create(
                    session_id=session_id,
                    suiteType=SuiteType.TEST,
                    started=datetime.datetime.now().isoformat(),
                    title="test-1-" + _,
                    standing=_,
                    file="test-1.js",
                    tests=1,
                    parent=str(suite.suiteID),
                    **{_.lower(): 1}
                )

        await register_patch_suite(suite_id, test_id)
        await register_patch_suite(parent_id, test_id)

        await patchTestSuite(suite_id, test_id)
        await patchTestSuite(parent_id, test_id)

        child_suite = await SuiteBase.filter(suiteID=suite_id).first()
        assert child_suite.passed == child_suite.failed == child_suite.skipped == 3
        assert child_suite.tests == 9
        child_rollup_suite = await RollupBase.filter(suite_id=suite_id).first()
        assert (
            child_rollup_suite.passed
            == child_rollup_suite.failed
            == child_rollup_suite.skipped
            == 3
        )
        assert child_rollup_suite.tests == 9

        parent_suite = await SuiteBase.filter(suiteID=parent_id).first()
        assert parent_suite.passed == parent_suite.skipped == 0
        assert parent_suite.failed == 1
        assert parent_suite.tests == 1

        parent_rollup_suite = await RollupBase.filter(suite_id=parent_id).first()
        assert (
            parent_rollup_suite.passed
            == parent_rollup_suite.failed
            == parent_rollup_suite.skipped
            == 3
        )
        assert parent_rollup_suite.tests == 9
