from handshake.services.DBService.models.attachmentBase import (
    LogType,
    TestLogBase,
    LogGeneratedBy,
)
from handshake.services.DBService.shared import get_test_id
from sanic.request import Request
from sanic.response import JSONResponse
from pydantic import ValidationError
from typing import Dict, Any, Optional


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


async def attachLog(payload, attachmentType: LogType, description: str):
    await TestLogBase.create(
        test_id=get_test_id(),
        type=attachmentType,
        feed=payload,
        title=f"caught {LogType} while responding to an API call",
        message=description,
        generatedByGroup=LogGeneratedBy.API,
        generatedBy=(payload.get("url", False) if payload else False) or "api-service",
    )


async def attachError(payload, url: str):
    await attachLog(
        payload,
        LogType.ERROR,
        f"Failed to process the request at: {url}, will affect the test run",
    )


async def attachInfo(payload, url: str):
    await attachLog(
        payload,
        LogType.INFO,
        f"utilizing: {url}",
    )


async def attachWarn(payload, url: str):
    await attachLog(
        payload,
        LogType.WARN,
        f"Failed to process the request at: {url}, we will miss this attachment",
    )


def prune_nones(payload: Dict[Any, Optional[Any]]):
    return {_: payload[_] for _ in payload.keys() if payload[_] is not None}
