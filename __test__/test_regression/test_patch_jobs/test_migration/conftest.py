import shutil
import time

from pytest import fixture
from pathlib import Path
from handshake.services.DBService.models.enums import ConfigKeys

from __test__.test_regression.conftest import testNames
from handshake.services.DBService.shared import db_path as shared_db_path
from handshake.services.DBService.lifecycle import init_tortoise_orm, close_connection
from handshake.services.DBService.models import RunBase
from tortoise.connection import connections


@fixture
def scripts():
    return (
        Path(__file__).parent.parent.parent.parent.parent
        / "handshake"
        / "services"
        / "DBService"
        / "scripts"
    )


@fixture()
def root_dir():
    return Path(__file__).parent.parent.parent.parent.parent / "TestMigration"


@fixture()
def db_path(root_dir):
    return shared_db_path(root_dir)


@fixture(autouse=True)
async def clean_close(db_path, init_db, root_dir):
    if root_dir.exists():
        shutil.rmtree(root_dir)

    if not db_path.exists():
        init_db()

    await init_tortoise_orm(db_path)
    yield

    # deleting sample test runs
    await RunBase.filter(projectName=testNames).all().delete()
    await close_connection()
    time.sleep(1)
    shutil.rmtree(root_dir)


@fixture
async def get_v3_connection(scripts):
    connection = connections.get("default")

    # assuming we are at v4
    await connection.execute_script((scripts / "revert-v4.sql").read_text())
    await connection.execute_query(
        "UPDATE CONFIGBASE set value = '3' where key = ?", (ConfigKeys.version,)
    )

    return connection
