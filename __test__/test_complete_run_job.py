import datetime

from pytest import mark
from graspit.services.DBService.models import (
    TaskBase,
    SuiteBase,
    TestConfigBase,
    SessionBase,
)
from sanic_testing.testing import SanicTestClient
from graspit.services.DBService.models.types import AttachmentType
from graspit.services.DBService.models.enums import Status
from graspit.services.SchedularService.register import register_patch_test_run


@mark.usefixtures("sample_test_session")
class TestRunCompletion:
    # testing the Patch Test Run

    async def test_run_with_no_sessions(self, sample_test_run, patch):
        test = await sample_test_run
        await SessionBase.filter(test_id=test.testID).delete()
        assert not await SessionBase.filter(
            test_id=test.testID
        ).exists(), "Session should not exist!"
        await register_patch_test_run(test.testID)

        patch()

        error = await TestConfigBase.filter(
            test_id=test.testID, type=AttachmentType.ERROR
        ).first()

        assert (
            error is not None
        ), "Test run should be marked with an error in case of any error"
        assert (
            "no sessions" in error.attachmentValue["reason"]
        ), "There should be a valid reason"

    async def test_error_handling(self, sample_test_session, patch):
        test = (await sample_test_session).test_id
        await register_patch_test_run(test)

        # here patchTestRun fails as it would have session with no end date

        patch()

        error = await TestConfigBase.filter(
            test_id=test, type=AttachmentType.ERROR
        ).first()

        assert (
            error is not None
        ), "Test run should be marked with an error in case of any error"
        assert (
            "Failed to patch the test run, error in calculation"
            in error.attachmentValue["reason"]
        ), "There should be a valid reason"

    async def test_patch_jobs(self, app, sample_test_session, patch):
        test_session = await sample_test_session
        test_id = test_session.test_id

        service_app = app
        service_app.config.TEST_ID = test_id
        client: SanicTestClient = service_app.asgi_client
        started = datetime.datetime.now()

        payload = dict(
            title="sample Test Suite 1",
            suiteType="SUITE",
            retried=0,
            started=started.isoformat(),
            file="./suite-1.js",
            parent="",
            standing="PENDING",
            session_id=str(test_session.sessionID),
        )
        request, response = await client.put("/save/registerSuite", json=payload)
        assert response.status_code == 201
        suite_id = response.text

        for _ in range(3):
            payload = dict(
                title=f"sample Test {_}",
                suiteType="TEST",
                retried=0,
                started=(started + datetime.timedelta(seconds=1)).isoformat(),
                file="./suite-1.js",
                parent=suite_id,
                standing="PENDING",
                session_id=str(test_session.sessionID),
            )
            request, response = await client.put("/save/registerSuite", json=payload)
            assert response.status_code == 201
            test_id = response.text

            payload = dict(
                duration=4000,
                ended=(started + datetime.timedelta(seconds=5)).isoformat(),
                suiteID=test_id,
                error=None,
                errors=[],
                session_id=str(test_session.sessionID),
            )

            request, response = await client.put("/save/updateSuite", json=payload)
            print(response.text)
            assert response.status_code == 201

        payload = dict(
            duration=6000,
            ended=(started + datetime.timedelta(seconds=6)).isoformat(),
            suiteID=suite_id,
            error=None,
            errors=[],
            session_id=str(test_session.sessionID),
        )

        request, response = await client.put("/save/updateSuite", json=payload)
        assert response.status_code == 201

        payload = dict(
            duration=4000,
            ended=(started + datetime.timedelta(seconds=6)).isoformat(),
            passed=3,
            skipped=0,
            tests=3,
            hooks=3,
            failed=0,
            error=None,
            errors=[],
            sessionID=str(test_session.sessionID),
            entityName="pytest",
            entityVersion="1.0.0",
            simplified="pytest_windows_1.0.0",
        )

        request, response = await client.put("/save/updateSession", json=payload)
        assert response.status_code == 201

        request, response = await client.put("/done")
        assert response.status_code == 200

        patch()

        suite = await SuiteBase.filter(suiteID=suite_id).first()

        # testing Patch Suite
        assert suite.passed == 3
        assert suite.failed == 0
        assert suite.skipped == 0
        assert suite.standing == Status.PASSED
        assert suite.tests == 3
        assert len(suite.errors) == 0
