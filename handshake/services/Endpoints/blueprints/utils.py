from handshake.services.DBService.models.static_base import (
    AttachmentType,
    TestConfigBase,
)
from handshake.services.DBService.shared import get_test_id
from sanic.request import Request
from sanic.response import JSONResponse


def extractPayload(request: Request, response: JSONResponse):
    payload = dict(
        url=request.url,
        payload=request.json,
        status=response.status,
        reason=response.body.decode(),
    )
    return payload


async def attachError(payload, attachmentType: AttachmentType, url: str):
    await TestConfigBase.create(
        test_id=get_test_id(),
        attachmentValue=payload,
        type=attachmentType,
        description=f"Failed to process the request at: {url}, will affect the test run",
    )
