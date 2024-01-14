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
    return (
        f"handshake-{platform.system()}.exe"
        if platform.system() == "Windows"
        else f"handshake-{platform.system()}"
    )


@fixture()
def init_db(root_dir):
    return lambda: subprocess.call(f'handshake config "{root_dir}"', shell=True)


async def get_connection(scripts, v=3):
    connection = connections.get("default")

    # assuming we are at v5
    if v < 5:
        await connection.execute_script((scripts / "revert-v5.sql").read_text())
    if v < 4:
        await connection.execute_script((scripts / "revert-v4.sql").read_text())

    return connection


@fixture
def get_vth_connection():
    return get_connection


@fixture
def scripts():
    return (
        Path(__file__).parent.parent
        / "handshake"
        / "services"
        / "DBService"
        / "scripts"
    )
