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
