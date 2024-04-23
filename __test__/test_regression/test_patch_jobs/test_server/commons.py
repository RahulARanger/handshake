from typing import Coroutine, Any
from handshake.services.DBService.models import (
    SessionBase,
)
from sanic import Sanic
from multiprocessing.sharedctypes import Array
from pathlib import Path
from typing import Optional


async def set_config(
    app: Sanic,
    session: Coroutine[Any, Any, SessionBase],
    db_path: Optional[Path] = None,
):
    _session = await session
    app.config.TEST_ID = str((await _session.test).testID)
    if db_path:
        app.shared_ctx.ROOT = Array("c", str.encode(str(db_path)))
    return _session
