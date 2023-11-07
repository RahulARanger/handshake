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
                    **{_.lower(): 1},
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

    async def test_rollup_errors(self, sample_test_session):
        session = await sample_test_session
        test_id = session.test_id
        session_id = session.sessionID

        parent_suite = await SuiteBase.create(
            session_id=session_id,
            suiteType=SuiteType.SUITE,
            started=datetime.datetime.now().isoformat(),
            title="suite-parent",
            standing=Status.YET_TO_CALCULATE,
            file="test-1.js",
            parent="",
        )

        suites = []
        tests = []

        for index in range(3):
            suite = await SuiteBase.create(
                session_id=session_id,
                suiteType=SuiteType.SUITE,
                started=datetime.datetime.now().isoformat(),
                title="suite-parent",
                standing=Status.YET_TO_CALCULATE,
                file="test-1.js",
                parent=parent_suite.suiteID,
            )

            suites.append(suite.suiteID)

            _tests = []

            for test in range(3):
                test = await SuiteBase.create(
                    session_id=session_id,
                    suiteType=SuiteType.TEST,
                    started=datetime.datetime.now().isoformat(),
                    title="suite-parent",
                    standing=Status.FAILED,
                    file="test-1.js",
                    parent=suites[-1],
                    errors=[{"message": f"{index}-{test}"}],
                )
                _tests.append(test.suiteID)

            await register_patch_suite(suites[-1], test_id)
            tests.append(_tests)

        await register_patch_suite(parent_suite.suiteID, test_id)

        for suite in suites:
            await patchTestSuite(suite, test_id)
        await patchTestSuite(parent_suite.suiteID, test_id)

        for index, suite in enumerate(suites):
            suite_record = await SuiteBase.filter(suiteID=suite).first()
            errors = suite_record.errors
            assert len(errors) == 3

            for _index, error in enumerate(errors):
                assert error["message"] == f"{index}-{_index}"
                assert error["mailedFrom"] == [str(tests[index][_index])]

        parent_errors = (
            await SuiteBase.filter(suiteID=parent_suite.suiteID).first()
        ).errors
        assert len(parent_errors) == 9

        for _index, suite in enumerate(suites):
            test_index = _index % 3
            suite_index = _index // 3

            error = parent_errors[_index]
            assert error["message"] == f"{suite_index}-{test_index}"
            assert error["mailedFrom"] == [
                str(tests[suite_index][test_index]),
                str(suites[suite_index]),
            ]

    async def test_dependency_of_suites(self, sample_test_session):
        # we would have suite - 1 and suite - 2
        # suite - 2 is child of the suite - 1
        # suite - 2 is under processing but suite - 1 will now be processed so, in that case

        session = await sample_test_session
        session_id = session.sessionID
        test = await session.test
        suites = []

        for suiteIndex in range(2):
            suite = await SuiteBase.create(
                started=datetime.datetime.now().isoformat(),
                title=f"sample-suite-{suiteIndex + 1}",
                session_id=session_id,
                suiteType=SuiteType.SUITE,
                file="",
                parent="",
                standing=Status.YET_TO_CALCULATE,
            )
            suites.append(suite)
            await register_patch_suite(suite.suiteID, test.testID)

        child_suite = suites[1]
        parent_suite = suites[0]
        await child_suite.update_from_dict(dict(parent=parent_suite.suiteID))
        await child_suite.save()

        # if returned false, Task will not be deleted
        assert not await patchTestSuite(parent_suite.suiteID, session.test)

        assert await patchTestSuite(child_suite.suiteID, session.test)
        assert await patchTestSuite(parent_suite.suiteID, session.test)
