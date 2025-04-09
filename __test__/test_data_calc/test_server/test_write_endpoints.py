from pytest import mark
from handshake.services.DBService.models import StaticBase
from handshake.services.DBService.lifecycle import attachment_folder
from __test__.test_data_calc.test_server.commons import set_config

from pathlib import Path


@mark.usefixtures("sample_test_session")
class TestSaveEndpoints:
    async def test_register_written_attachment(
        self, client, app, sample_test_session, create_suite, db_path
    ):
        session = await set_config(app, sample_test_session, db_path)
        suite = await create_suite(session.sessionID)

        payload = dict(
            entity_id=str(suite.suiteID),
            type="PNG",
            description="sample-attachment",
            title="sample",
        )
        request, response = await client.put(
            "/save/registerAWrittenAttachment", json=payload
        )
        assert response.status == 201
        path = Path(response.text)
        assert (
            attachment_folder(db_path)
            / str(session.test_id)
            / str(suite.suiteID)
            / path.name
            == path
        )
        saved = await StaticBase.filter(attachmentID=path.stem).first()
        assert saved.value == path.name
        assert saved.title == "sample"
