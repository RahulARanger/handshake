from json import loads, dumps
from handshake.services.DBService.models.config_base import ConfigBase
from handshake.services.DBService import DB_VERSION
from handshake.services.DBService.models.result_base import RunBase
from handshake.services.DBService.migrator import migration
from tortoise import Tortoise, connections
from handshake.services.DBService.shared import db_path
from pathlib import Path
from typing import Optional, Union
from loguru import logger
from handshake.services.SchedularService.constants import (
    writtenAttachmentFolderName,
)

models = ["handshake.services.DBService.models"]


def attachment_folder(provided_db_path: Path, *args):
    to_path = provided_db_path.parent / writtenAttachmentFolderName
    if args:
        for arg in args:
            to_path /= str(arg)
    return to_path


async def close_connection():
    await connections.close_all()
    # waiting for the logs to be sent or saved
    await logger.complete()


async def init_tortoise_orm(
    force_db_path: Optional[Union[Path, str]] = None,
    migrate: bool = False,
    close_it: bool = False,
    init_script: bool = False,
    config_path: Optional[Union[Path, str]] = None,
    avoid_config: Optional[bool] = False,
):
    chosen = force_db_path if force_db_path else db_path()
    force_init_scripts = not chosen.exists()
    # migrator is called here
    if migrate:
        migration(chosen)

    # creating a connection
    await Tortoise.init(
        db_url=r"{}".format(f"sqlite://{chosen}"),
        modules={"models": models},
    )
    # generating schemas
    await Tortoise.generate_schemas()

    test = TestConfigManager(chosen, config_path)
    # we run the init scripts for the newly created db
    await test.sync(init_script or force_init_scripts, avoid_config)

    if close_it:
        await close_connection()


async def create_run(projectName: str) -> str:
    test_id = str((await RunBase.create(projectName=projectName)).testID)
    return test_id


class TestConfigManager:
    def __init__(
        self, test_result_db: Path, config_path: Optional[Union[str, Path]] = None
    ):
        # default file
        # enhancement: Allow user to provide the path for the config file
        self.path = (
            Path(config_path) if config_path else Path.cwd()
        ) / "handshake.json"
        self.db_path = test_result_db
        attachment_folder(self.db_path).mkdir(exist_ok=True)

    async def sync(
        self, init_script: bool = False, avoid_config: Optional[bool] = False
    ):
        if init_script:
            await connections.get("default").execute_script(
                f"""
            INSERT OR IGNORE INTO configbase("key", "value", "readonly") VALUES('MAX_RUNS_PER_PROJECT', '10', '0');
            INSERT OR IGNORE INTO configbase("key", "value", "readonly") VALUES('RESET_FIX_TEST_RUN', '', '1');
            INSERT OR IGNORE INTO configbase("key", "value", "readonly") VALUES('VERSION', '{DB_VERSION}', '1');
            INSERT OR IGNORE INTO configbase("key", "value", "readonly") VALUES('RECENTLY_DELETED', '0', '1');
            """,
            )
        if avoid_config:
            return

        if not self.path.exists():
            logger.debug(
                "missing handshakes.json, creating one at {}", self.path.parent
            )
            return await self.save_to_file()
        await self.import_things()

    async def save_to_file(self):
        return self.path.write_text(
            dumps(
                dict(
                    zip(
                        await ConfigBase.filter(readonly=False).values_list(
                            "key", flat=True
                        ),
                        await ConfigBase.filter(readonly=False).values_list(
                            "value", flat=True
                        ),
                    )
                ),
                indent=4,
            )
        )

    async def import_things(self):
        expect_on = await ConfigBase.filter(readonly=False)
        to_save = []
        hard_save = False
        refer_from = loads(self.path.read_text())
        for record in expect_on:
            if record.key not in refer_from:
                # since some of the keys are missing, we are going to save them
                hard_save = True
                continue
            record.value = refer_from[record.key]
            to_save.append(record)
        to_save and await ConfigBase.bulk_update(to_save, ("value",), 100)
        if hard_save:
            logger.debug(
                "Observed some of the keys are missing in handshakes.json, saving it"
            )
            await self.save_to_file()
