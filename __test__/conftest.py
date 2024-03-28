import platform
import subprocess

from pytest import fixture, mark
from pathlib import Path
from handshake.services.DBService.shared import db_path as shared_db_path
from tortoise.connection import connections
from handshake.services.DBService.lifecycle import init_tortoise_orm, close_connection
from handshake.services.DBService.models import RunBase, SessionBase
from datetime import datetime, timedelta, UTC
from handshake.services.Endpoints.core import service_provider

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

    # assuming we are at v7
    if v < 7:
        await connection.execute_script((scripts / "revert-v7.sql").read_text())
    if v < 6:
        await connection.execute_script((scripts / "revert-v6.sql").read_text())
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


@fixture(autouse=True)
async def clean_close(db_path, init_db):
    if not db_path.exists():
        init_db()

    await init_tortoise_orm(db_path)
    yield

    # deleting sample test runs
    await RunBase.filter(projectName=testNames).all().delete()
    await close_connection()


@fixture()
async def sample_test_run():
    return await RunBase.create(projectName=testNames, started=datetime.now(UTC))


@fixture()
async def sample_test_session(sample_test_run: RunBase):
    started = datetime.now(UTC)
    return await SessionBase.create(
        started=started,
        test_id=(await sample_test_run).testID,
        ended=started + timedelta(milliseconds=24),
    )


@fixture()
def app():
    return service_provider
