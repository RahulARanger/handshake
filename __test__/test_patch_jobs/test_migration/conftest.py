import shutil
import time

from pytest import fixture
from pathlib import Path
from __test__.conftest import testNames
from handshake.services.DBService.shared import db_path as shared_db_path
from handshake.services.DBService.lifecycle import init_tortoise_orm, close_connection
from handshake.services.DBService.models import RunBase
from handshake.services.DBService.models.enums import ConfigKeys
from tortoise import connections


@fixture()
def root_dir():
    return Path(__file__).parent.parent.parent.parent / "TestMigration"


@fixture()
def db_path(root_dir):
    return shared_db_path(root_dir)


@fixture(autouse=True)
async def clean_close(db_path, init_db, root_dir):
    if root_dir.exists():
        shutil.rmtree(root_dir)

    root_dir.mkdir()

    if not db_path.exists():
        init_db()

    await init_tortoise_orm(db_path)
    yield

    # deleting sample test runs
    await RunBase.filter(projectName=testNames).all().delete()
    await close_connection()
    time.sleep(1)

    if root_dir.exists():
        shutil.rmtree(root_dir)


async def get_config_value(key):
    return (
        await connections.get("default").execute_query(
            "SELECT value from configbase where key = ?", (key,)
        )
    )[1][0]["value"]


async def get_version():
    return await get_config_value(ConfigKeys.version)
