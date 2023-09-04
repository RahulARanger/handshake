from nextpyreports.services.DBService.models.config_base import ConfigBase
from nextpyreports.services.DBService.models.result_base import RunBase
from tortoise import Tortoise, connections
from nextpyreports.services.DBService.shared import db_path
from typing import Optional

models = ["nextpyreports.services.DBService.models"]


async def init_tortoise_orm(force_db_path: Optional[str] = None):
    await Tortoise.init(db_url=r"{}".format(f'sqlite://{force_db_path if force_db_path else db_path()}'), modules={
        "models": models
    })
    await Tortoise.generate_schemas()


async def create_run(projectName: str) -> str:
    await ConfigBase.update_or_create(
        configID=69
    )
    return str((await RunBase.create(
        projectName=projectName
    )).testID)


async def close_connection():
    await connections.close_all()
