from sanic import Sanic
from sanic.blueprints import Blueprint
from sanic.response import HTTPResponse, text, JSONResponse, json
from sanic.request import Request
from typing import TypedDict

one_liners = Blueprint(name="one_liners", url_prefix="/")


# Here we will have requests which are very simple

@one_liners.get("/")
async def health_status(request: Request) -> HTTPResponse:
    return text("1")


@one_liners.get("/isItDone")
async def isItDone(request: Request) -> JSONResponse:
    app: Sanic = request.app
    tasks = [task.get_name() async for task in app.tasks if not task.done()]

    return json(
        dict(
            done=len(tasks) == 0,
            message=tasks
        )
    )


@one_liners.post("/setLastWave")
def setLastWave(request: Request) -> HTTPResponse:
    return text("1")


class ByeWithCommands(TypedDict):
    deleteDB: bool


# bye is core request but can sometimes be cruel if it didn't complete its work
@one_liners.post("/bye")
async def bye(request: Request) -> HTTPResponse:
    resp: ByeWithCommands = request.json
    request.app.m.terminate()
    return text("1")
