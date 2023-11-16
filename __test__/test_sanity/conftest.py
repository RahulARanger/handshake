from pytest import fixture, mark
from pathlib import Path
from graspit.services.DBService.shared import db_path as shared_db_path
from subprocess import call

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
    return root_dir / "dist"


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
