import datetime
import json
from pytest import mark
from handshake.services.DBService.models import (
    RunBase,
    TestConfigBase,
)
from sanic import Sanic
from __test__.test_patch_jobs.test_server.commons import set_config


@mark.usefixtures("sample_test_session")
class TestSaveEndpoints:
    async def test_register_session(self, client, app, sample_test_session):
        await set_config(app, sample_test_session)
        payload = dict(
            specs=["test.spec.js", "test2.spec.js"],
            started=datetime.datetime.now().isoformat(),
        )
        request, response = await client.put("/save/registerSession", json=payload)
        assert response.status == 201

    # async def test_register_suite


@mark.usefixtures("sample_test_session")
class TestSaveEndPoints:
    @staticmethod
    async def set_test_run(app: Sanic, test_run: RunBase):
        app.config.TEST_ID = test_run.testID
        return test_run

    async def test_we_have_pydantic_in_place(self, client, helper_create_test_run, app):
        await self.set_test_run(app, (await helper_create_test_run()))

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

        reasons = json.loads(result["reason"])
        assert len(reasons) == len(required)

        for missing in reasons:
            assert missing["type"] == "missing"
            assert missing["loc"][0] in required
            assert missing["msg"] == "Field required"
            assert missing["input"] == payload

    async def test_set_config_api(self, client, helper_create_test_run, app):
        test = await self.set_test_run(app, (await helper_create_test_run()))

        payload = dict(
            maxInstances=1,
            fileRetries=1,
            framework="pytest",
            exitCode=1,
            bail=1,
            platformName="windows",
            tags=[{"label": "*.py", "desc": "only py file"}],
            avoidParentSuitesInCount=False,
        )
        request, response = await client.put("/save/currentRun", json=payload)
        assert response.status == 200, response.text

        record = await TestConfigBase.filter(test_id=test.testID).first()
        assert record is not None
        test = await record.test
        assert test.exitCode == 1
        assert record.platform == "windows"
        assert record.maxInstances == 1
        assert record.fileRetries == 1
        assert record.avoidParentSuitesInCount is False
