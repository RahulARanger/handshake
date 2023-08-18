from src.services.DBService.models.config_base import ReportBase
from src.services.DBService.models.result_base import RunBase
from tortoise import Tortoise, connections
from src.services.DBService.shared import db_name, db_path
from atexit import register
from asyncio import run
from sanic import Sanic


async def create_run(
        label: str, projectName: str, instances: int, frame_work: str, max_retries: int
) -> str:
    print("---CREATING TEST RUN---")
    return str((await RunBase.create(
        collectionName=label, projectName=projectName, instances=instances,
        framework=frame_work,
        totalRetries=max_retries
    )).testID)


async def init_tortoise_orm():
    await Tortoise.init(db_url=r"{}".format(f'sqlite://{db_path()}'), modules={
        "models": ["src.services.DBService.models"]
    })
    await Tortoise.generate_schemas()


async def set_limits(max_reports: int):
    config, _ = await ReportBase.update_or_create(
        configID=0,
        maxTestRuns=max_reports
    )
    await config.save()


async def close_connection():
    await connections.close_all()


async def wake_up_and_close():
    await init_tortoise_orm()
    await close_connection()


def end_of_day():
    if not hasattr(Sanic.get_app().shared_ctx, "ROOT"):
        return

    path = db_path().parent
    if not ((path / (db_name() + "-shm")).exists() or (path / (db_name() + "-wal")).exists()):
        return
    run(
        wake_up_and_close()
    )


register(
    end_of_day
)
