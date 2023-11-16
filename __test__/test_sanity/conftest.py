from pytest import fixture, mark
from pathlib import Path
from graspit.services.DBService.shared import db_path as shared_db_path
from graspit.services.DBService.lifecycle import init_tortoise_orm, close_connection
from graspit.services.DBService.models import RunBase, SessionBase
from datetime import datetime, timedelta
from subprocess import call
from sanic_testing.testing import SanicASGITestClient
from graspit.services.Endpoints.core import service_provider


pytestmark = mark.asyncio

testNames = "pyTestForOurProject"


@fixture()
def root_dir():
    return Path(__file__).parent.parent.parent / "TestResults"


@fixture()
def db_path(root_dir):
    return shared_db_path(root_dir)


@fixture()
def dist(root_dir):
    return root_dir.parent / "dist"


@fixture()
def patch(root_dir, dist):
    return lambda: call(f'graspit patch "{root_dir}"', shell=True, cwd=dist)


@fixture()
def init_db(root_dir, dist):
    return lambda: call(f'graspit config "{root_dir}"', shell=True, cwd=dist)


@fixture(autouse=True)
async def clean_close(db_path, init_db):
    if not db_path.exists():
        init_db()

    await init_tortoise_orm(db_path)
    yield

    # deleting sample test runs
    await RunBase.filter(projectName=testNames).all().delete()
    await close_connection()
