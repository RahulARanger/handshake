from sanic import Sanic
from sanic.blueprints import Blueprint
from sanic.response import HTTPResponse, text, JSONResponse, json
from sanic.request import Request
from src.services.Endpoints.types import ByeWithCommands

one_liners = Blueprint(name="one_liners", url_prefix="/")


# Here we will have requests which are very simple but used at crucial points

@one_liners.get("/")
async def health_status(request: Request) -> HTTPResponse:
    return text("1")


@one_liners.get("/isItDone")
async def isItDone(request: Request) -> JSONResponse:
    return json(
        dict(
            done=True,
            message="Completed"
        )
    )


@one_liners.post("/setLastWave")
def setLastWave(request: Request) -> HTTPResponse:
    return text("1")


# bye is core request, so make sure to handle it carefully
@one_liners.post("/bye")
async def bye(request: Request) -> HTTPResponse:
    resp: ByeWithCommands = request.json
    request.app.m.terminate()
    return text("1")
