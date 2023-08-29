from pytest import fixture, mark
from pathlib import Path
from src.services.DBService.shared import db_path as shared_db_path

pytestmark = mark.asyncio


@fixture(scope="module")
def root_dir():
    return Path(__file__).parent.parent.parent / "TestResults"


@fixture(scope="module")
def db_path(root_dir):
    return shared_db_path(root_dir)
