from pytest import fixture
from pathlib import Path
from src.services.DBService.shared import db_path as shared_db_path


@fixture()
def root_dir():
    return Path(__file__).parent.parent / "TestResults"


@fixture(scope="module")
def db_path(root_dir):
    return shared_db_path(root_dir)

