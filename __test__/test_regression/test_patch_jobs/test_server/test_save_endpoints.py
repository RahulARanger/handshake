import json
from typing import Coroutine, Any
from pytest import mark
from handshake.services.DBService.models import (
    RunBase,
    SessionBase,
    AttachmentBase,
    TestConfigBase,
)
from handshake.services.DBService.models.types import (
    AttachmentType,
)
from sanic import Sanic


async def set_config(app: Sanic, session: Coroutine[Any, Any, SessionBase]):
    _session = await session
    app.config.TEST_ID = str((await _session.test).testID)
    return _session


@mark.usefixtures("sample_test_session")
class TestAttachmentEndpoints:
    async def test_empty_attachments(
        self, client, app, sample_test_session, sample_test_run
    ):
        await set_config(app, sample_test_session)
        payload = []
        request, response = await client.put(
            "/save/addAttachmentsForEntities", json=payload
        )
        assert response.status == 201

    async def test_bulk_attachments_with_errors(
        self, app, client, sample_test_session, create_suite
    ):
        session = await set_config(app, sample_test_session)

        suite = await create_suite(session.sessionID)
        second_suite = await create_suite(session.sessionID)

        first_error_payload = dict(
            entityID=str(suite.suiteID),
            type=AttachmentType.ASSERT,
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
        assert await TestConfigBase.filter(test_id=test_id).count() == 2

        first, second = await TestConfigBase.filter(
            test_id=test_id, type=AttachmentType.WARN
        ).all()

        assert first.attachmentValue["url"] == "/addAttachmentsForEntities"
        assert first.attachmentValue["payload"] == first_error_payload

        assert "missing" in first.attachmentValue["reason"]
        assert "value" in first.attachmentValue["reason"]

        assert second.attachmentValue["url"] == "/addAttachmentsForEntities"
        assert second.attachmentValue["payload"] == second_error_payload

        assert "missing" in first.attachmentValue["reason"]
        assert "entityID" in second.attachmentValue["reason"]

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
                value="https://test.com",
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

        added_assert = await AttachmentBase.filter(
            type=AttachmentType.ASSERT, entity_id=suite.suiteID
        ).first()
        assert added_assert.attachmentValue["value"] == "https://test.com"
        assert added_assert.type == AttachmentType.ASSERT

        assert await AttachmentBase.filter(entity_id=suite.suiteID).count() == 4


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

        reasons = json.loads(result["reason"])
        assert len(reasons) == len(required)

        for missing in reasons:
            assert missing["type"] == "missing"
            assert missing["loc"][0] in required
            assert missing["msg"] == "Field required"
            assert missing["input"] == payload
