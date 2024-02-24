from pytest import mark
from handshake.services.DBService.models import (
    StaticBase,
)
from __test__.test_regression.test_patch_jobs.test_server.commons import set_config
from pathlib import Path


@mark.usefixtures("sample_test_session")
class TestSaveEndpoints:
    async def test_register_written_attachment(
        self, client, app, sample_test_session, sample_test_run, create_suite, db_path
    ):
        session = await set_config(app, sample_test_session, db_path)
        suite = await create_suite(session.sessionID)

        payload = dict(
            entityID=str(suite.suiteID),
            type="PNG",
            description="sample-attachment",
            title="sample",
        )
        request, response = await client.put(
            "/save/registerAWrittenAttachment", json=payload
        )
        assert response.status == 201
        path = Path(response.text)
        assert path
        assert str(session.test_id) in str(path)
        assert str(path).endswith(path.name)
        saved = await StaticBase.filter(attachmentID=path.stem).first()
        assert saved.attachmentValue["value"] == path.name
        assert saved.attachmentValue["title"] == "sample"
