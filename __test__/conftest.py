import platform
import subprocess
from typing import Optional
from pytest import fixture, mark
from pathlib import Path
from handshake.services.DBService.shared import db_path as shared_db_path
from tortoise.connection import connections
from handshake.services.DBService.lifecycle import init_tortoise_orm, close_connection
from handshake.services.DBService.models import RunBase, SessionBase, ConfigBase
from datetime import datetime, timedelta, UTC
from handshake.services.Endpoints.core import service_provider
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
    await RunBase.filter(projectName__icontains=testNames).all().delete()
    await close_connection()


async def sample_test_run(postfix: Optional[str] = ""):
    noted = datetime.now(UTC)
    return await RunBase.create(
        projectName=testNames + postfix,
        started=noted,
        ended=noted + timedelta(minutes=10),
        duration=timedelta(minutes=10).total_seconds() * 1000,
    )


async def attach_db_config(maxRunsPerProject=2):
    record, _ = await ConfigBase.update_or_create(key=ConfigKeys.maxRunsPerProject)
    record.value = maxRunsPerProject
    await record.save()


@fixture()
def helper_create_test_run():
    return sample_test_run


@fixture()
def helper_set_db_config():
    return attach_db_config


@fixture()
async def sample_test_session(helper_create_test_run):
    return await test_session((await helper_create_test_run()).testID)


async def test_session(test_id: str):
    started = datetime.now(UTC)
    return await SessionBase.create(
        started=started,
        test_id=test_id,
        ended=started + timedelta(milliseconds=24),
    )


@fixture()
def helper_create_test_session():
    return test_session


@fixture()
def app():
    return service_provider


def helper_to_test_date_operator(from_db: datetime, from_json: str):
    assert datetime.strptime(from_json, "%Y-%m-%d %H:%M:%S.%f%z").strftime(
        "%Y-%m-%d %H:%M:%S%z"
    ) == from_db.astimezone(UTC).strftime("%Y-%m-%d %H:%M:%S%z"), "Datetime is not same"
