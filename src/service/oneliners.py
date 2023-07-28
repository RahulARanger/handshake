from sanic.blueprints import Blueprint
from sanic.response import HTTPResponse, text
from sanic.request import Request

one_liners = Blueprint(name="one_liners", version=1, url_prefix="")


# Here we will have requests which are very simple

@one_liners.get("/")
async def health_status(request: Request) -> HTTPResponse:
    return text("1")


# bye is core request but can sometimes be cruel if it didn't complete its work
@one_liners.post("/bye")
def bye(request: Request) -> HTTPResponse:
    request.app.m.terminate()
    return text("1")
