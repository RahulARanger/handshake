import datetime
import json
from pytest import mark
from handshake.services.DBService.models import (
    RunBase,
    SuiteBase,
)
from handshake.services.DBService.models.enums import Status, SuiteType
from sanic import Sanic
from __test__.test_data_calc.test_server.commons import set_config


@mark.usefixtures("sample_test_session")
class TestRegisterSession:
    async def test_register_session(self, client, app, sample_test_session):
        await set_config(app, sample_test_session)
        payload = dict(
            specs=["test.spec.js", "test2.spec.js"],
            started=datetime.datetime.now().isoformat(),
        )
        request, response = await client.post("/create/Session", json=payload)
        assert response.status == 201

    # async def test_register_suite


@mark.usefixtures("sample_test_session")
class TestRegisterSuite:
    async def test_register_suite(self, client, app, sample_test_session):
        await set_config(app, sample_test_session)
        payload = dict(
            title="Sample Suite",
            description="sample suite description",
            suiteType=SuiteType.SUITE,
            session_id=str(sample_test_session.sessionID),
            file="test.spec.js",
            started=datetime.datetime.now().isoformat(),
            tags=[dict(label="sample-tag", desc="sample tag for testing")],
            parent="",
        )
        request, response = await client.post("/create/Suite", json=payload)
        assert response.status == 201, response.text

        parent_suite = response.text

        payload = dict(
            title="Sample Test",
            description="sample test description",
            suiteType=SuiteType.TEST,
            session_id=str(sample_test_session.sessionID),
            file="test.spec.js",
            started=datetime.datetime.now().isoformat(),
            tags=[dict(label="sample-tag", desc="sample tag for testing")],
            parent=parent_suite,
            is_processing=False,
        )
        request, response = await client.post("/create/Suite", json=payload)
        assert response.status == 201, response.text

        test = response.text

        suite_record = await SuiteBase.filter(suiteID=parent_suite).first()
        test_record = await SuiteBase.filter(suiteID=test).first()

        assert suite_record.suiteType == SuiteType.SUITE
        assert suite_record.standing == Status.PROCESSING
        assert suite_record.title == "Sample Suite"

        assert test_record.suiteType == SuiteType.TEST
        assert test_record.standing == Status.PENDING
        assert test_record.title == "Sample Test"
