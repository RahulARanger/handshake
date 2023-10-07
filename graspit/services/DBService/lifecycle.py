from graspit.services.DBService.models.config_base import (
    TestConfigBase,
    ValueForTestRunConfigBase,
    ConfigBase,
)
from graspit.services.DBService.models.result_base import RunBase
from graspit.services.DBService.models.enums import AttachmentType, ConfigKeys
from tortoise import Tortoise, connections
from graspit.services.DBService.shared import db_path
from pathlib import Path
from typing import Optional, Union
from graspit import __version__
from platform import uname


models = ["graspit.services.DBService.models"]


async def init_tortoise_orm(force_db_path: Optional[Union[Path, str]] = None):
    await Tortoise.init(
        db_url=r"{}".format(
            f"sqlite://{force_db_path if force_db_path else db_path()}"
        ),
        modules={"models": models},
    )
    await Tortoise.generate_schemas()


async def create_run(projectName: str) -> str:
    await set_default_config()
    default_config_for_test_run: ValueForTestRunConfigBase = dict(
        maxTestRuns=100, platformName=uname().system, version=__version__
    )
    test_id = str((await RunBase.create(projectName=projectName)).testID)

    await TestConfigBase.create(
        description="",  # "Config set for this run"
        type=AttachmentType.CONFIG,
        attachmentValue=default_config_for_test_run,
        test_id=test_id,
    )

    return test_id


async def set_default_config():
    record, _ = await ConfigBase.update_or_create(key=ConfigKeys.maxRuns, value=100)
    await record.save()


async def close_connection():
    await connections.close_all()
