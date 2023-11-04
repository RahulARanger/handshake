import datetime
from typing import Coroutine, Any
from pytest import mark
from graspit.services.DBService.models import RunBase, SessionBase, SuiteBase
from graspit.services.DBService.models.enums import SuiteType, Status
from sanic import Sanic


@mark.usefixtures("sample_test_session")
class TestSaveEndPoints:
    @staticmethod
    async def set_test_run(app: Sanic, test_run: Coroutine[Any, Any, RunBase]):
        test = await test_run
        app.config.TEST_ID = test.testID
        return test

    async def test_we_have_pydantic_in_place(self, client, sample_test_run, app):
        await self.set_test_run(app, sample_test_run)

        payload = dict(simplified="sample")
        request, response = await client.put("/save/updateSession", json=payload)

        result = response.json
        assert response.status == 400

        required = {
            "duration",
            "skipped",
            "passed",
            "failed",
            "tests",
            "entityName",
            "entityVersion",
            "ended",
            "hooks",
            "sessionID",
        }

        assert len(result) == len(required)
        for missing in result:
            assert missing["type"] == "missing"
            assert missing["loc"][0] in required
            assert missing["msg"] == "Field required"
            assert missing["input"] == payload

    async def test_run_cycle(
        self,
        sample_test_run,
        app,
        client,
        allow_failed=True,
        allow_passed=True,
        allow_skipped=True,
    ):
        test_run = await self.set_test_run(app, sample_test_run)

        payload = dict(
            specs=["./test-1.js"],
            started=datetime.datetime.now().isoformat(),
            retried=0,
        )

        # Register Session
        request, response = await client.put("/save/registerSession", json=payload)
        assert response.status == 201

        session_id = response.text

        session_record = await SessionBase.filter(sessionID=session_id).first()
        assert session_record is not None

        assert session_record.specs == ["./test-1.js"]
        assert (await session_record.test).testID == test_run.testID
        assert session_record.started.isoformat() == payload["started"] + "+00:00"

        for suite in range(3):
            payload = dict(
                title=f"Test Suite: {suite + 1}",
                suiteType=SuiteType.SUITE,
                file="./test-1.js",
                session_id=str(session_record.sessionID),
                parent="",
                retried=0,
                started=datetime.datetime.now().isoformat(),
            )
            request, response = await client.put("/save/registerSuite", json=payload)
            assert response.status == 201

            suite_id = response.text

            suite_record = await SuiteBase.filter(suiteID=suite_id).first()

            assert suite_record.file == "./test-1.js"
            assert str((await suite_record.session).sessionID) == session_id
            assert suite_record.started.isoformat() == payload["started"] + "+00:00"
            assert suite_record.retried == 0
            assert suite_record.suiteType == SuiteType.SUITE

            # Registering Tests
            for test in range(10):
                payload = dict(
                    title=f"Test: {suite + 1} - {test + 1}",
                    suiteType=SuiteType.TEST,
                    file="./test-1.js",
                    session_id=str(session_record.sessionID),
                    parent=suite_id,
                    retried=0,
                    started=datetime.datetime.now().isoformat(),
                )
                request, response = await client.put(
                    "/save/registerSuite", json=payload
                )
                assert response.status == 201

                test_id = response.text
                test_record = await SuiteBase.filter(suiteID=test_id).first()

                assert test_record.file == "./test-1.js"
                assert str((await test_record.session).sessionID) == session_id
                assert test_record.started.isoformat() == payload["started"] + "+00:00"
                assert test_record.retried == 0
                assert test_record.suiteType == SuiteType.TEST

                assert test_record.parent == suite_id
                assert test_record.passed == 0
                assert test_record.failed == 0
                assert test_record.skipped == 0

            # Updating Tests
            for index, test in enumerate(
                await SuiteBase.filter(parent=suite_id)
                .all()
                .values_list("suiteID", flat=True)
            ):
                assert test
                status = Status.PASSED

                match index:
                    case 0:
                        status = (
                            Status.PASSED
                            if allow_passed
                            else Status.FAILED
                            if allow_failed
                            else Status.SKIPPED
                        )
                    case 1:
                        status = (
                            Status.FAILED
                            if allow_failed
                            else Status.PASSED
                            if allow_passed
                            else Status.SKIPPED
                        )
                    case 2:
                        status = (
                            Status.SKIPPED
                            if allow_skipped
                            else Status.PASSED
                            if allow_passed
                            else Status.FAILED
                        )

                payload = dict(
                    duration=1000,
                    ended=(
                        (await SuiteBase.filter(suiteID=str(test)).first()).started
                        + datetime.timedelta(seconds=1)
                    ).isoformat(),
                    suiteID=str(test),
                    errors=[],
                    standing=status,
                )
                request, response = await client.put("/save/updateSuite", json=payload)
                assert response.status == 201

                test_record = await SuiteBase.filter(suiteID=str(test)).first()

                assert test_record.file == "./test-1.js"
                assert str((await test_record.session).sessionID) == session_id
                assert test_record.ended.isoformat() == payload["ended"]
                assert test_record.suiteType == SuiteType.TEST

                assert getattr(test_record, test_record.standing.lower()) == 1
                assert test_record.standing == status

            # Updating Suite
            payload = dict(
                duration=10000,
                ended=(
                    (await SuiteBase.filter(suiteID=suite_id).first()).started
                    + datetime.timedelta(seconds=10)
                ).isoformat(),
                suiteID=suite_id,
                errors=[],
                standing=Status.PASSED,
            )
            request, response = await client.put("/save/updateSuite", json=payload)
            assert response.status == 201

            suite_record = await SuiteBase.filter(suiteID=suite_id).first()

            assert suite_record.file == "./test-1.js"
            assert str((await suite_record.session).sessionID) == session_id
            assert suite_record.ended.isoformat() == payload["ended"]
            assert suite_record.suiteType == SuiteType.SUITE

            assert suite_record.passed == 0
            assert suite_record.skipped == 0
            assert suite_record.failed == 0

            assert suite_record.standing == Status.YET_TO_CALCULATE

        # Mark Session
        payload = {}

        request, response = await client.put("/save/updateSession", json=payload)
        assert response.status == 201

        session_id = response.text

        session_record = await SessionBase.filter(sessionID=session_id).first()
        assert session_record is not None

        assert session_record.specs == ["./test-1.js"]
        assert (await session_record.test).testID == test_run.testID
        assert session_record.started.isoformat() == payload["started"] + "+00:00"

    async def test_mark_session(self):
        ...
