from pytest import fixture, mark
from pathlib import Path
from graspit.services.DBService.shared import db_path as shared_db_path
from graspit.services.DBService.lifecycle import init_tortoise_orm, close_connection
from graspit.services.DBService.models import RunBase, SessionBase
from uuid import uuid4
from datetime import datetime

pytestmark = mark.asyncio

testNames = "pyTestForOurProject"


@fixture(scope="module")
def root_dir():
    return Path(__file__).parent.parent.parent / "TestResults"


@fixture(scope="module")
def db_path(root_dir):
    return shared_db_path(root_dir)


@fixture(autouse=True)
async def clean_close(db_path):
    await init_tortoise_orm(db_path)
    yield

    # deleting sample test runs
    await RunBase.filter(projectName=testNames).all().delete()
    await close_connection()


@fixture(scope="module")
async def sample_test_run():
    return await RunBase.create(projectName=testNames)


@fixture(scope="module")
async def sample_test_session(sample_test_run):
    session_id = str(uuid4().hex)
    return await SessionBase.create(
        sessionID=session_id,
        started=datetime.now(),
        test_id=(await sample_test_run).testID
    )
