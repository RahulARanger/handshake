from sanic import Sanic
from sanic.response import text, json, JSONResponse, HTTPResponse
from sanic.request import Request
from src.service.oneliners import one_liners

service_provider = Sanic("WDIO-PY")
service_provider.blueprint(one_liners)


@service_provider.post("/setLastWave")
def setLastWave(request: Request) -> HTTPResponse:
    return text("1")


@service_provider.get("/isItDone")
def isItDone(request: Request) -> JSONResponse:
    return json({"done": True})



