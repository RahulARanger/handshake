from sanic import Sanic
from pathlib import Path
from src.services.DBService.sanic_free_shared import db_name


def root_dir() -> Path:
    return Path(Sanic.get_app().shared_ctx.ROOT.value.decode('utf-8'))


def db_path() -> Path:
    return root_dir() / db_name()


def set_test_id():
    app: Sanic = Sanic.get_app()
    app.config.TEST_ID = app.shared_ctx.TEST_ID.value.decode('utf-8')


def get_test_id() -> str:
    return Sanic.get_app().config.TEST_ID
