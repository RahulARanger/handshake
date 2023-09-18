from nextpyreports.services.Endpoints.center import service_provider
from nextpyreports.services.DBService.lifecycle import init_tortoise_orm, close_connection, create_run
from nextpyreports.services.DBService.shared import set_test_id
from click import argument, option, Path
from pathlib import Path as P_Path
from nextpyreports.handle_shipment import handle_cli
from multiprocessing.sharedctypes import Array
from sanic.worker.loader import AppLoader
from sanic import Sanic
from typing import Tuple
from loguru import logger


def feed_app() -> Sanic:
    return service_provider


def prepare_loader() -> Tuple[Sanic, AppLoader]:
    loader = AppLoader(factory=feed_app)
    app = loader.load()
    return app, loader


def setup_app(
        projectname: str,
        path: str, port: int = 6969, workers: int = 2, fast: bool = False,
        debug: bool = True):
    if not P_Path(path).is_dir():
        raise NotADirectoryError(path)

    @service_provider.main_process_start
    async def get_me_started(app, loop):
        service_provider.shared_ctx.ROOT = Array('c', str.encode(path))
        await init_tortoise_orm()
        test_id = await create_run(projectname)
        service_provider.shared_ctx.TEST_ID = Array('c', str.encode(test_id))
        set_test_id()

    @service_provider.main_process_stop
    async def close_things(app, loop):
        await close_connection()

    _app, loader = prepare_loader()
    _app.prepare(
        port=port, workers=min(2, workers),
        host="127.0.0.1", fast=fast, debug=debug
    )
    logger.info("Serving at port: {}", port)
    Sanic.serve(primary=_app, app_loader=loader)


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
@option(
    "-d", "--debug", default=False, is_flag=True, type=bool, show_default=True,
    help="Run the Sanic Server in debug mode for better logs"
)
def run_app(
        projectname: str,
        path: str, port: int, workers: int, fast: bool,
        debug: bool
):
    setup_app(projectname, path, port, workers, fast, debug)


if __name__ == "__main__":
    setup_app("sample", "../TestResults")
