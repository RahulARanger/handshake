from pytest import fixture, mark
from pathlib import Path
from graspit.services.DBService.shared import db_path as shared_db_path
from graspit.services.DBService.lifecycle import init_tortoise_orm, close_connection
from graspit.services.DBService.models import RunBase, SessionBase
from datetime import datetime

pytestmark = mark.asyncio

testNames = "pyTestForOurProject"


@fixture()
def root_dir():
    return Path(__file__).parent.parent / "TestResults"


@fixture()
def db_path(root_dir):
    return shared_db_path(root_dir)


@fixture(autouse=True)
async def clean_close(db_path):
    assert db_path.exists(), "DB does not exist"
    await init_tortoise_orm(db_path)
    yield

    # deleting sample test runs
    await RunBase.filter(projectName=testNames).all().delete()
    await close_connection()


@fixture()
async def sample_test_run():
    return await RunBase.create(projectName=testNames)


@fixture()
async def sample_test_session(sample_test_run):
    return await SessionBase.create(
        started=datetime.now(),
        test_id=(await sample_test_run).testID
    )
