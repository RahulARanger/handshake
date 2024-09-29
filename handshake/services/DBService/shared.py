from sanic import Sanic
from pathlib import Path
from handshake.services.DBService.sanic_free_shared import db_name
from typing import Optional, Union

APP_NAME = "Handshake"


def root_dir() -> Path:
    return Path(Sanic.get_app(APP_NAME).shared_ctx.ROOT.value.decode("utf-8"))


def db_path(given_root: Optional[Union[str, Path]] = None) -> Path:
    if not given_root:
        return root_dir() / db_name()

    return Path(given_root) / db_name()


def set_test_id():
    app: Sanic = Sanic.get_app(APP_NAME)
    if not hasattr(app.shared_ctx, "TEST_ID"):
        return
    # ease of access so
    app.config.TEST_ID = str(app.shared_ctx.TEST_ID.value.decode("utf-8"))


def get_test_id() -> str:
    return Sanic.get_app(APP_NAME).config.TEST_ID
