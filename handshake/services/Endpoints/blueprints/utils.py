from handshake.services.DBService.models.static_base import (
    AttachmentType,
    TestConfigBase,
)
from handshake.services.DBService.shared import get_test_id
from sanic.request import Request
from sanic.response import JSONResponse
from pydantic import ValidationError


def extractPayload(request: Request, response: JSONResponse):
    payload = dict(
        url=request.url,
        payload=request.json,
        status=response.status,
        reason=response.body.decode(),
    )
    return payload


def extractPydanticErrors(url, payload, error: ValidationError):
    payload = dict(
        url=url,
        payload=payload,
        status="ERROR",
        reason=error.json(),
    )
    return payload


async def attachLog(payload, attachmentType: AttachmentType, description: str):
    await TestConfigBase.create(
        test_id=get_test_id(),
        attachmentValue=payload,
        type=attachmentType,
        description=description,
    )


async def attachError(payload, url: str):
    await attachLog(
        payload,
        AttachmentType.ERROR,
        f"Failed to process the request at: {url}, will affect the test run",
    )


async def attachWarn(payload, url: str):
    await attachLog(
        payload,
        AttachmentType.WARN,
        f"Failed to process the request at: {url}, we will miss this attachment",
    )
