from src.services.DBService.models.result_base import SessionBase, SuiteBase
from sanic.request import Request
from sanic.blueprints import Blueprint
from sanic.response import json, JSONResponse, text
from sanic import Sanic

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


@get_service.get("/session-status")
async def get_session_status(_: Request):
    _id = _.args.get("sessionID")
    if not await SessionBase.exists(sessionID=_id):
        return text(f"Session Not found: {_id}", status=404)

    return text((await SessionBase.filter(sessionID=_id).first()).standing, status=200)
