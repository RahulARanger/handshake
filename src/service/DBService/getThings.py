from src.service.DBService.models.config_base import SessionBase, SuiteBase
from sanic.request import Request
from sanic.blueprints import Blueprint
from sanic.response import json, JSONResponse

get_service = Blueprint("GetService", url_prefix="/get")


@get_service.get("/sessions")
async def get_sessions(_: Request) -> JSONResponse:
    rows = await SessionBase.all()
    return json(
        [
            {"id": row.sessionID, "browserName": row.browserName}
            for row in rows
        ]
    )
