from sanic import Sanic
from sanic.response import text, json, JSONResponse, HTTPResponse
from sanic.request import Request
from tortoise import Tortoise, connections
from src.service.oneliners import one_liners
from src.service.DBService.center import service
from pathlib import Path
from tempfile import mkstemp
from os import close
from multiprocessing.sharedctypes import Array
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


async def init_tortoise_orm(file_path: str):
    await Tortoise.init(db_url=r"{}".format(f'sqlite://{file_path}'), modules={
        "models": ["src.service.DBService.models"]
    })
    await Tortoise.generate_schemas()


# from tortoise.contrib.sanic import register_tortoise
# custom way to register tortoise, we are doing this because the file path is dynamically generated
@service_provider.main_process_start
async def started(app, loop):
    _, temp_file = mkstemp(suffix=".db", prefix='wdio-py-reporter')
    close(_)
    # temp_file = "sample.db"
    app.shared_ctx.db_path = Array('c', str.encode(temp_file), lock=False)


@service_provider.before_server_start
async def before_start_of_day(app: Sanic, loop):
    file_path = app.shared_ctx.db_path.value.decode("utf-8")
    print("starting connection", file_path)
    await init_tortoise_orm(file_path)


@service_provider.after_server_stop
async def end_of_day(app: Sanic, loop):
    print("closing connections")
    await connections.close_all()


@service_provider.main_process_stop
async def packing_bags(app: Sanic, loop):
    try:
        main_file = Path(app.shared_ctx.db_path.value.decode("utf-8"))
        shm = main_file.parent / (main_file.name + "-shm")
        wal = main_file.parent / (main_file.name + "-wal")
        shm.unlink(missing_ok=True)
        wal.unlink(missing_ok=True)
        main_file.unlink(missing_ok=True)
        print("DELETED DB")
    except OSError as error:
        print("FAILED TO DELETE DB", error)
