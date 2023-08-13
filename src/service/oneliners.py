from sanic.blueprints import Blueprint
from sanic.response import HTTPResponse, text
from sanic.request import Request
from typing import TypedDict
from tempfile import TemporaryFile
from pathlib import Path
from sanic.log import logger


temp_file = TemporaryFile(suffix=".db")
save_file_name = f'/{temp_file.name}'
logger.info("Connecting to a database at: %s", save_file_name)

del temp_file

# save_file_name = "sample-test.sqlite"
# uncomment above line if you need to debug the file generated

one_liners = Blueprint(name="one_liners", url_prefix="/")


# Here we will have requests which are very simple

@one_liners.get("/")
async def health_status(request: Request) -> HTTPResponse:
    return text("1")


class ByeWithCommands(TypedDict):
    deleteDB: bool


# bye is core request but can sometimes be cruel if it didn't complete its work
@one_liners.post("/bye")
def bye(request: Request) -> HTTPResponse:
    resp: ByeWithCommands = request.json

    try:
        Path(save_file_name).unlink() if resp.get("deleteDB", True) else None
    except OSError:
        logger.exception("Failed to delete the database", exc_info=True)

    request.app.m.terminate()
    return text("1")
