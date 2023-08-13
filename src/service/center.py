from sanic import Sanic
from sanic.response import text, json, JSONResponse, HTTPResponse
from sanic.request import Request
from tortoise.contrib.sanic import register_tortoise
from src.service.oneliners import one_liners, save_file_name
from src.service.DBService.center import service
from src.service.DBService.getThings import get_service

service_provider = Sanic("WDIO-PY")
service_provider.blueprint(one_liners)
service_provider.blueprint(service)
service_provider.blueprint(get_service)


@service_provider.post("/setLastWave")
def setLastWave(request: Request) -> HTTPResponse:
    return text("1")


@service_provider.get("/isItDone")
def isItDone(request: Request) -> JSONResponse:
    return json({"done": True})


register_tortoise(service_provider, db_url=r"{}".format(f'sqlite://${save_file_name}'), modules={
    "models": ["src.service.DBService.models"]
}, generate_schemas=True)
