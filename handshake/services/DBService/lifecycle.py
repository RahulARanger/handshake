from json import loads, dumps
from handshake.services.DBService.models.config_base import ConfigBase
from handshake.services.DBService import DB_VERSION
from handshake.services.DBService.models.result_base import RunBase
from handshake.services.DBService.migrator import migration
from tortoise import Tortoise, connections
from handshake.services.DBService.shared import db_path
from pathlib import Path
from typing import Optional, Union, TypedDict, Dict
from loguru import logger
from handshake.services.SchedularService.constants import (
    writtenAttachmentFolderName,
)
from sys import stderr
from click import Context
from click.core import ParameterSource


models = ["handshake.services.DBService.models"]


class VersionFile(TypedDict):
    browser_download_url: str


def handshake_meta() -> Dict["0", VersionFile]:
    version_file = Path(__file__).parent.parent.parent / ".version"
    return loads(version_file.read_text())


class DashboardMetaData(TypedDict):
    version: str
    browser_download_url_for_dashboard: str


def handshake_meta_dashboard() -> Union[DashboardMetaData, False]:
    version_file = Path(__file__).parent.parent.parent / "dashboard-meta.json"
    return False if not version_file.exists() else loads(version_file.read_text())


def save_handshake_meta_dashboard(**kwargs):
    version_file = Path(__file__).parent.parent.parent / "dashboard-meta.json"
    loaded = handshake_meta_dashboard() or {}
    loaded.update(kwargs)
    version_file.write_text(dumps(loaded))


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
    path: Path

    def __init__(
        self,
        test_result_db: Optional[Path] = None,
        config_path: Optional[Union[str, Path]] = None,
    ):
        # default file
        # enhancement: Allow user to provide the path for the config file

        self.db_path = test_result_db
        self.pick_cfg_pth(config_path)
        if test_result_db:
            attachment_folder(self.db_path).mkdir(exist_ok=True)

    def pick_cfg_pth(self, config_path: str):
        prefs = [
            Path(config_path) if config_path else None,
            Path.cwd(),
            self.db_path.parent if self.db_path else None,
        ]
        for pref in prefs:
            if not pref:
                continue
            check = pref / "handshake.json"
            self.path = check
            if check.exists():
                break

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
            return None

        if not self.path.exists():
            logger.info(
                "Missing handshakes.json.,"
                " creating one at {}. we would be referring this file from now on when ran from this path.",
                self.path.parent,
            )
            return await self.save_to_file()
        await self.import_things()
        return None

    async def save_to_file(self):
        values = dict(
            zip(
                await ConfigBase.filter(readonly=False).values_list("key", flat=True),
                await ConfigBase.filter(readonly=False).values_list("value", flat=True),
            )
        )
        schema = {
            "$schema": "https://raw.githubusercontent.com/RahulARanger/handshake/"
            "refs/heads/master/handshake-config.schema.json",
            "MAX_RUNS_PER_PROJECT": int(values.get("MAX_RUNS_PER_PROJECT", 100)),
        }

        return self.path.write_text(dumps(schema, indent=4))

    async def import_things(self):
        expect_on = await ConfigBase.filter(readonly=False)
        to_save = []
        hard_save = False
        refer_from = loads(self.path.read_text())
        for record in expect_on:
            if record.key not in refer_from:
                # since some keys are missing, we are going to save them
                hard_save = True
                continue

            # make sure to understand what was provided and convert it accordingly.
            value = refer_from[record.key]
            match record.key:
                case "MAX_RUNS_PER_PROJECT":
                    value = str(refer_from[record.key])

            record.value = value
            to_save.append(record)
        to_save and await ConfigBase.bulk_update(to_save, ("value",), 100)
        if hard_save:
            logger.info(
                "Observed some of the keys are missing in handshakes.json, saving it"
            )
            await self.save_to_file()

    def get_config_for_command(self, command_name: str, quiet: bool = True):
        if self.path.exists():
            content = loads(self.path.read_text()).get("COMMANDS", {})
            value = content.get(command_name, False)
            if value:
                return value

        not quiet and logger.info(
            "You can save the configuration for this command: {} inside the handshake.json",
            command_name,
        )
        return {}

    def get_path(self, path: str):
        return self.path.parent / Path(path)


def log_less():
    logger.remove(0)
    logger.add(stderr, level="INFO")


def decide_value(context: Context, key: str, saved: dict, value_given):
    if context.get_parameter_source(
        key.lower()
    ) == ParameterSource.DEFAULT and saved.get(key):
        return saved[key]
    return value_given

def decide_value_with_return(context: Context, key: str, saved: dict, value_given):
    if context.get_parameter_source(
        key.lower()
    ) == ParameterSource.DEFAULT and saved.get(key):
        return saved[key], True
    return value_given, False

