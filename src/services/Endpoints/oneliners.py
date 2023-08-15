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
async def isItDone(_: Request) -> JSONResponse:
    # pending = await pending_tasks()
    pending = 0
    return json(
        dict(
            done=pending == 0,
            message=f"{pending} tasks are pending" if pending else "Completed"
        )
    )


# bye is core request, so make sure to handle it carefully
@one_liners.post("/bye")
async def bye(request: Request) -> HTTPResponse:
    resp: ByeWithCommands = request.json
    request.app.m.terminate()
    return text("1")
