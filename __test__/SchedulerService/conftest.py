from pytest import fixture, mark
from pathlib import Path
from nextpyreports.services.DBService.shared import db_path as shared_db_path
from nextpyreports.services.DBService.lifecycle import init_tortoise_orm, close_connection

pytestmark = mark.asyncio


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
    await close_connection()
