from handshake.services.CommandLine.migrate import handle_cli
from handshake.services.CommandLine._init import general_but_optional_requirement
from handshake.services.Endpoints.center import service_provider
from handshake.services.DBService.lifecycle import (
    init_tortoise_orm,
    close_connection,
    create_run,
)
from typing import Union
from handshake.services.DBService.shared import set_test_id
from click import argument, option, Path
from pathlib import Path as P_Path

from multiprocessing.sharedctypes import Array
from sanic.worker.loader import AppLoader
from sanic import Sanic
from typing import Tuple
from functools import partial
from loguru import logger
from handshake.services.Endpoints.static_server import static_provider


def feed_app() -> Sanic:
    return service_provider


def feed_static_provider(export: str) -> Sanic:
    static_provider.static(
        "/", str(P_Path(export)), name="export", index=["index.html", "RUNS.html"]
    )
    return static_provider


def prepare_loader() -> Tuple[Sanic, AppLoader]:
    loader = AppLoader(factory=feed_app)
    app = loader.load()
    return app, loader


def setup_app(
    projectname: str,
    path: str,
    port: int = 6969,
    workers: int = 2,
    fast: bool = False,
    debug: bool = True,
):
    @service_provider.main_process_start
    async def get_me_started(app, loop):
        service_provider.shared_ctx.ROOT = Array("c", str.encode(path))
        await init_tortoise_orm()
        test_id = await create_run(projectname)
        service_provider.shared_ctx.TEST_ID = Array("c", str.encode(test_id))
        set_test_id()

    @service_provider.main_process_stop
    async def close_things(app, loop):
        await close_connection()

    _app, loader = prepare_loader()
    _app.prepare(
        port=port, workers=min(2, workers), host="127.0.0.1", fast=fast, debug=debug
    )
    logger.info("Serving at port: {}", port)
    Sanic.serve(primary=_app, app_loader=loader)


@handle_cli.command(
    short_help="Starts the server which would listen for your input",
    help="""
Starts the Handshake server to listen for inputs at the specified port on localhost. This command initiates a test run, allowing the server to handle a single test run at a time. For multiple test runs, spawn the process separately on different ports.
""",
)
@argument("PROJECT_NAME", nargs=1, required=True, type=str)
@general_but_optional_requirement
@option(
    "-p",
    "--port",
    default=6969,
    show_default=True,
    help="Port for the service to connect to",
    type=int,
)
@option(
    "-w",
    "--workers",
    default=2,
    show_default=True,
    help="Number of workers to use",
    type=int,
)
@option(
    "-f",
    "--fast",
    default=False,
    help="Asks Sanic to set the use max. number of workers",
    is_flag=True,
    type=bool,
    show_default=True,
)
@option(
    "-d",
    "--debug",
    default=False,
    is_flag=True,
    type=bool,
    show_default=True,
    help="Run the Sanic Server in debug mode for better logs",
)
def run_app(
    collection_path: str,
    project_name: str,
    port: int,
    workers: int,
    fast: bool,
    debug: bool,
):
    P_Path(collection_path).mkdir(exist_ok=True)
    setup_app(project_name, collection_path, port, workers, fast, debug)


@handle_cli.command(
    help="serves the generated reports. simply serves the static files generated in your directory mentioned "
    "in static_path",
    short_help="serves generated report",
)
@argument("STATIC_PATH", nargs=1, required=False, type=Path(exists=True, dir_okay=True))
def display(static_path: Union[str, P_Path] = "TestReports"):
    if static_path:
        static_path = P_Path(static_path)

        if not static_path.exists():
            raise NotADirectoryError(f"{static_path} does not exist")

    loader = AppLoader(factory=partial(feed_static_provider, static_path))
    _app = loader.load()
    _app.prepare(host="127.0.0.1")
    Sanic.serve(primary=_app, app_loader=loader)


if __name__ == "__main__":
    setup_app("sample", "../../../TestResults")
