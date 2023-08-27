from src.services.Endpoints.center import service_provider
from click import argument, option, Path
from pathlib import Path as P_Path
from src.handle_shipment import handle_cli
from multiprocessing.sharedctypes import Array
from src.services.DBService.lifecycle import init_tortoise_orm, close_connection, create_run, set_limits
from src.services.SchedularService.updateRecords import fix_old_records
from src.services.DBService.shared import set_test_id
from sanic.worker.loader import AppLoader
from sanic import Sanic
from typing import Tuple


def feed_app() -> Sanic:
    return service_provider


def prepare_loader() -> Tuple[Sanic, AppLoader]:
    loader = AppLoader(factory=feed_app)
    app = loader.load()
    return app, loader


@handle_cli.command()
@argument("projectName", nargs=1, required=True, type=str)
@argument("path", nargs=1, type=Path(exists=True, dir_okay=True), required=True)
@option(
    "-p", "--port", default=6969, show_default=True, help="Port for the service to connect to", type=int
)
@option(
    "-w", "--workers", default=2, show_default=True,
    help="Number of workers to use, note min: 2 workers are required", type=int
)
@option(
    "-f", "--fast", default=False, help="Asks Sanic to set the use max. number of workers",
    is_flag=True, type=bool, show_default=True
)
def run_app(
        projectname: str,
        path: str, port: int, workers: int, fast: bool
):
    if not P_Path(path).is_dir():
        raise NotADirectoryError(path)

    @service_provider.main_process_start
    async def get_me_started(app, loop):
        service_provider.shared_ctx.ROOT = Array('c', str.encode(path))
        await init_tortoise_orm()
        test_id = await create_run(projectname)
        service_provider.shared_ctx.TEST_ID = Array('c', str.encode(test_id))
        await set_limits()  # Empty function as of now
        set_test_id()

    @service_provider.main_process_stop
    async def close_things(app, loop):
        await close_connection()

    _app, loader = prepare_loader()
    _app.prepare(
        port=port, workers=min(2, workers),
        host="127.0.0.1", fast=fast
    )
    Sanic.serve(primary=_app, app_loader=loader)


@handle_cli.command()
@argument("path", nargs=1, type=Path(exists=True, dir_okay=True), required=True)
@option(
    "-p", "--port", default=6969, show_default=True, help="Port for the Generating the report", type=int
)
def prepare_report(
        path: str, port: int
):
    if not P_Path(path).is_dir():
        raise NotADirectoryError(path)

    @service_provider.main_process_start
    async def get_me_started(app, loop):
        service_provider.shared_ctx.ROOT = Array('c', str.encode(path))
        await init_tortoise_orm()

    @service_provider.main_process_stop
    async def close_things(app, loop):
        await close_connection()

    _app, loader = prepare_loader()
    _app.prepare(
        port=port,
        host="127.0.0.1"
    )
    Sanic.serve(primary=_app, app_loader=loader)
