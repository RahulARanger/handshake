import json
from handshake.services.DBService.models.config_base import ConfigBase
from handshake.services.DBService import DB_VERSION
from handshake.services.DBService.models.result_base import RunBase
from handshake.services.DBService.models.enums import ConfigKeys
from handshake.services.DBService.migrator import migration
from tortoise import Tortoise, connections
from handshake.services.DBService.shared import db_path
from pathlib import Path
from typing import Optional, Union
from loguru import logger

models = ["handshake.services.DBService.models"]


def config_file(provided_db_path: Path):
    return provided_db_path.parent / "config.json"


async def init_tortoise_orm(
    force_db_path: Optional[Union[Path, str]] = None, migrate: bool = False
):
    chosen = force_db_path if force_db_path else db_path()
    if migrate:
        migration(chosen)

    await Tortoise.init(
        db_url=r"{}".format(f"sqlite://{chosen}"),
        modules={"models": models},
    )
    await Tortoise.generate_schemas()
    await set_default_config(chosen)


async def create_run(projectName: str) -> str:
    test_id = str((await RunBase.create(projectName=projectName)).testID)
    return test_id


async def set_default_config(path: Path):
    config_file_provided = config_file(path)
    config_provided = (
        json.loads(config_file_provided.read_text())
        if config_file_provided.exists()
        else dict()
    )

    for key, value in [
        (ConfigKeys.version, DB_VERSION),
        # below keys can be overridden by the config file
        *[
            (_, config_provided.get(_, __))
            for _, __ in [
                (ConfigKeys.maxRuns, "100"),
            ]
        ],
    ]:
        record = await ConfigBase.filter(key=str(key)).first()
        if not record:
            await ConfigBase.create(key=key, value=value)


async def close_connection():
    await connections.close_all()
    # waiting for the logs to be sent or saved
    await logger.complete()
