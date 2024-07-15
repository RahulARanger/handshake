import datetime
import json
from pytest import mark
from handshake.services.DBService.models import (
    RunBase,
    AttachmentBase,
    AssertBase,
    TestConfigBase,
    TestLogBase,
    SuiteBase,
)
from handshake.services.DBService.models.enums import LogType, AttachmentType
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
class TestAttachmentEndpoints:
    async def test_empty_attachments(self, client, app, sample_test_session):
        await set_config(app, sample_test_session)
        payload = []
        request, response = await client.put(
            "/save/addAttachmentsForEntities", json=payload
        )
        assert response.status == 201

    async def test_bulk_registration_of_parent_suites(
        self, app, client, sample_test_session, create_suite
    ):
        session = await set_config(app, sample_test_session)

        payloads = [
            dict(
                started=datetime.datetime.now().isoformat(),
                title="sample-suite-1",
                retried=0,
                description="sample-description",
                suiteType="SUITE",
                session_id=str(session.sessionID),
                file="./test.py",
                parent="",
                tags=[],
            ),
            dict(
                started=datetime.datetime.now().isoformat(),
                title="sample-suite-2",
                retried=0,
                description="sample-description",
                suiteType="SUITE",
                session_id=str(session.sessionID),
                file="./test.py",
                parent="",
                tags=[],
            ),
        ]
        request, response = await client.put(
            "/save/registerParentEntities", json=payloads
        )

        assert response.status == 201
        resp = response.json

        root_parent = await SuiteBase.filter(suiteID=resp[0]).first()
        assert root_parent.title == "sample-suite-1"
        assert root_parent.parent == ""

        child_suite = await SuiteBase.filter(suiteID=resp[1]).first()
        assert child_suite.title == "sample-suite-2"
        assert str(child_suite.parent) == str(root_parent.suiteID)

        payloads = [
            str(child_suite.suiteID),
            dict(
                started=datetime.datetime.now().isoformat(),
                title="sample-suite-3",
                retried=0,
                description="sample-description",
                suiteType="SUITE",
                session_id=str(session.sessionID),
                file="./test.py",
                parent="",
                tags=[],
            ),
        ]
        request, response = await client.put(
            "/save/registerParentEntities", json=payloads
        )
        assert response.status == 201
        resp = response.json

        child_suite = await SuiteBase.filter(suiteID=resp[0]).first()
        assert child_suite.title == "sample-suite-2"
        assert str(child_suite.parent) == str(root_parent.suiteID)

        child_suite_2 = await SuiteBase.filter(suiteID=resp[1]).first()
        assert child_suite_2.title == "sample-suite-3"
        assert str(child_suite_2.parent) == str(child_suite.suiteID)

    async def test_bulk_attachments_with_errors(
        self, app, client, sample_test_session, create_suite
    ):
        session = await set_config(app, sample_test_session)

        suite = await create_suite(session.sessionID)
        second_suite = await create_suite(session.sessionID)

        first_error_payload = dict(
            entityID=str(suite.suiteID), type=AttachmentType.ASSERT, value=dict()
        )
        expected_error_payload = dict(
            entityID=str(suite.suiteID),
            type=AttachmentType.ASSERT,
            value=dict(wait=-1, interval=-1),
        )

        second_error_payload = dict(
            description="sample-description",
            type=AttachmentType.LABEL,
            value="sample-label",
            color="red",
        )

        payload = [
            dict(
                entityID=str(suite.suiteID),
                type=AttachmentType.LINK,
                value="https://test.com",
            ),
            first_error_payload,
            dict(
                entityID=str(second_suite.suiteID),
                type=AttachmentType.DESC,
                value="sample-description",
                title="sample-title",
            ),
            second_error_payload,
        ]

        request, response = await client.put(
            "/save/addAttachmentsForEntities", json=payload
        )
        assert response.status == 206

        assert await AttachmentBase.filter(entity_id=suite.suiteID).count() == 1
        assert await AttachmentBase.filter(entity_id=second_suite.suiteID).count() == 1

        test_id = str((await session.test).testID)
        assert await TestLogBase.filter(test_id=test_id).count() == 2

        first, second = await TestLogBase.filter(
            test_id=test_id, type=LogType.WARN
        ).all()

        assert first.feed["url"] == "/addAttachmentsForEntities"
        assert first.feed["payload"] == expected_error_payload

        assert "missing" in first.feed["reason"]
        assert "value" in first.feed["reason"]

        assert second.feed["url"] == "/addAttachmentsForEntities"
        assert second.feed["payload"] == second_error_payload

        assert "missing" in first.feed["reason"]
        assert "entityID" in second.feed["reason"]

    async def test_bulk_attachments(
        self, app, client, sample_test_session, create_suite
    ):
        session = await set_config(app, sample_test_session)
        suite = await create_suite(session.sessionID)

        payload = [
            dict(
                entityID=str(suite.suiteID),
                type=AttachmentType.LINK,
                value="https://test.com",
            ),
            dict(
                entityID=str(suite.suiteID),
                type=AttachmentType.ASSERT,
                title="toExist",
                value=dict(
                    passed=True,
                    message="This log existed",
                ),
            ),
            dict(
                entityID=str(suite.suiteID),
                type=AttachmentType.ASSERT,
                title="toExist",
                value=dict(
                    passed=True,
                    message="This log existed",
                    wait=500,
                    interval=69,
                ),
            ),
            dict(
                entityID=str(suite.suiteID),
                type=AttachmentType.DESC,
                value="sample-description",
                title="sample-title",
            ),
            dict(
                entityID=str(suite.suiteID),
                description="sample-description",
                type=AttachmentType.LABEL,
                value="sample-label",
                color="red",
            ),
        ]
        request, response = await client.put(
            "/save/addAttachmentsForEntities", json=payload
        )
        assert response.status == 201

        label = await AttachmentBase.filter(
            type=AttachmentType.LABEL, entity_id=suite.suiteID
        ).first()
        assert label.attachmentValue["value"] == "sample-label"
        assert label.type == AttachmentType.LABEL
        assert label.attachmentValue["color"] == "red"

        desc = await AttachmentBase.filter(
            type=AttachmentType.DESC, entity_id=suite.suiteID
        ).first()
        assert desc.attachmentValue["value"] == "sample-description"
        assert desc.type == AttachmentType.DESC
        assert desc.attachmentValue["color"] == ""
        assert desc.attachmentValue["title"] == "sample-title"

        link = await AttachmentBase.filter(
            type=AttachmentType.LINK, entity_id=suite.suiteID
        ).first()
        assert link.attachmentValue["value"] == "https://test.com"
        assert link.type == AttachmentType.LINK

        assert await AssertBase.filter(entity_id=suite.suiteID).count() == 2
        assert await AssertBase.exists(
            entity_id=suite.suiteID,
            message="This log existed",
            interval=69,
            wait=500,
            title="toExist",
            passed=True,
        )
        assert await AssertBase.exists(
            entity_id=suite.suiteID,
            message="This log existed",
            title="toExist",
            interval=-1,
            wait=-1,
            passed=True,
        )
        assert await AttachmentBase.filter(entity_id=suite.suiteID).count() == 3


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
            tags=[{"name": "*.py", "label": "only py file"}],
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
