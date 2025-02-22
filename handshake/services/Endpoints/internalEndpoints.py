from handshake.services.DBService.lifecycle import close_connection
from sanic.blueprints import Blueprint
from sanic.response import HTTPResponse, text
from sanic.request import Request

one_liners = Blueprint(name="one_liners", url_prefix="/")


# Here we will have requests which are very simple but used at crucial points


@one_liners.get("/")
async def health_status(request: Request) -> HTTPResponse:
    return text("1", status=200)


# bye is a core request, so make sure to handle it carefully
@one_liners.post("/bye")
async def bye(request: Request) -> HTTPResponse:
    await close_connection()
    request.app.m.terminate()

    return text("1", status=202)
