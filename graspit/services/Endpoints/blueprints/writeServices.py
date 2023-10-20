from sanic.blueprints import Blueprint
from sanic.response import JSONResponse, text, HTTPResponse
from loguru import logger
from sanic.request import Request
from graspit.services.DBService.models.static_base import StaticBase

service = Blueprint("WriteService", url_prefix="/write")


@service.put("/attachedImage")
async def saveImage(request: Request):
    ...
