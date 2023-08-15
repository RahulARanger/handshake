from sanic import Sanic
from tortoise import Tortoise, connections
from src.services.Endpoints.oneliners import one_liners
from src.services.DBService.center import service
from pathlib import Path
from tempfile import mkstemp
from os import close
from multiprocessing.sharedctypes import Array
from src.services.DBService.getThings import get_service, get_db_name
from src.services.DBService.deleteDB import delete_db

service_provider = Sanic("WDIO-PY")
service_provider.blueprint(one_liners)
service_provider.blueprint(service)
service_provider.blueprint(get_service)


async def init_tortoise_orm(file_path: str):
    await Tortoise.init(db_url=r"{}".format(f'sqlite://{file_path}'), modules={
        "models": ["src.services.DBService.models"]
    })
    await Tortoise.generate_schemas()


# from tortoise.contrib.sanic import register_tortoise
# custom way to register tortoise, we are doing this because the file path is dynamically generated
@service_provider.main_process_start
async def started(app: Sanic, loop):
    # _, temp_file = mkstemp(suffix=".db", prefix='wdio-py-reporter')
    # close(_)

    # DEV
    temp_file = "sample.db"
    if temp_file == "sample.db":
        delete_db(Path.cwd() / temp_file)

    app.shared_ctx.db_path = Array('c', str.encode(temp_file), lock=False)


@service_provider.before_server_start
async def before_start_of_day(app: Sanic, loop):
    file_path = get_db_name()
    await init_tortoise_orm(file_path)
    print("DB - connected - DB PATH -", file_path)


@service_provider.after_server_stop
async def end_of_day(app: Sanic, loop):
    print("closing connections")
    await connections.close_all()


@service_provider.main_process_stop
async def packing_bags(app: Sanic, loop):
    try:
        main_file = Path(get_db_name())
        if main_file.name != "sample.db":
            delete_db(main_file)
            print("DELETED DB")
    except OSError as error:
        print("FAILED TO DELETE DB", error)
