from sanic.blueprints import Blueprint
from sanic.response import HTTPResponse, text
from sanic.request import Request
from typing import TypedDict

one_liners = Blueprint(name="one_liners", url_prefix="/")


# Here we will have requests which are very simple

@one_liners.get("/")
async def health_status(request: Request) -> HTTPResponse:
    return text("1")


class ByeWithCommands(TypedDict):
    deleteDB: bool


# bye is core request but can sometimes be cruel if it didn't complete its work
@one_liners.post("/bye")
async def bye(request: Request) -> HTTPResponse:
    resp: ByeWithCommands = request.json
    request.app.m.terminate()
    return text("1")
