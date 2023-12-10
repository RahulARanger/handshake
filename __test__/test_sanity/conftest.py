from pytest import fixture
from handshake.services.DBService.lifecycle import init_tortoise_orm, close_connection
from handshake.services.DBService.models import RunBase
from subprocess import call
from __test__.conftest import testNames


@fixture()
def patch(root_dir, dist, dist_name):
    return lambda: call(f'{dist_name} patch "{root_dir}"', shell=True, cwd=dist)


@fixture()
def init_db(root_dir, dist, dist_name):
    return lambda: call(f'{dist_name} config "{root_dir}"', shell=True, cwd=dist)


@fixture(autouse=True)
async def clean_close(db_path, init_db):
    if not db_path.exists():
        init_db()

    await init_tortoise_orm(db_path)
    yield

    # deleting sample test runs
    await RunBase.filter(projectName=testNames).all().delete()
    await close_connection()
