import platform
import subprocess

from pytest import fixture, mark
from pathlib import Path
from handshake.services.DBService.shared import db_path as shared_db_path
from tortoise.connection import connections
from handshake.services.DBService.models.enums import ConfigKeys

pytestmark = mark.asyncio

testNames = "pyTestForOurProject"


@fixture()
def root_dir():
    return Path(__file__).parent.parent / "TestResults"


@fixture()
def db_path(root_dir):
    return shared_db_path(root_dir)


@fixture()
def dist(root_dir):
    return root_dir.parent / "dist"


@fixture()
def dist_name():
    return f"handshake-{platform.system()}"


@fixture()
def init_db(root_dir):
    return lambda: subprocess.call(f'handshake config "{root_dir}"', shell=True)


@fixture
async def get_v3_connection(scripts):
    connection = connections.get("default")

    # assuming we are at v4
    await connection.execute_script((scripts / "revert-v4.sql").read_text())
    await connection.execute_query(
        "UPDATE CONFIGBASE set value = '3' where key = ?", (ConfigKeys.version,)
    )

    return connection


@fixture
def scripts():
    return (
        Path(__file__).parent.parent
        / "handshake"
        / "services"
        / "DBService"
        / "scripts"
    )
