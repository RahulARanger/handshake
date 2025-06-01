from handshake.services.CommandLine._init import (
    handle_cli,
    general_but_optionally_present,
    config_optional_path,
    observed_version,
    break_if_mismatch,
)
from handshake.services.Endpoints.center import service_provider
from handshake.services.DBService.lifecycle import (
    init_tortoise_orm,
    close_connection,
    create_run,
    log_less,
    TestConfigManager,
    decide_value,
)
from handshake import __version__
from typing import Union
from handshake.services.DBService.shared import set_test_id
from click import argument, option, Path, get_current_context
from pathlib import Path as P_Path
from multiprocessing.sharedctypes import Array
from sanic.worker.loader import AppLoader
from sanic import Sanic
from typing import Tuple, Optional
from functools import partial
from loguru import logger
from handshake.services.Endpoints.static_server import static_provider
from gc import set_debug, DEBUG_LEAK


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
    dev: bool = False,
    config_path: Optional[str] = None,
):
    @service_provider.main_process_start
    async def get_me_started(app, loop):
        service_provider.shared_ctx.ROOT = Array("c", str.encode(path))
        if dev:
            service_provider.shared_ctx.DEV = Array("c", str.encode("1"))
        await init_tortoise_orm(migrate=True, config_path=config_path)
        test_id = await create_run(projectname)
        service_provider.shared_ctx.TEST_ID = Array("c", str.encode(test_id))
        set_test_id()

    @service_provider.main_process_stop
    async def close_things(app, loop):
        await close_connection()

    if dev:
        set_debug(DEBUG_LEAK)

    _app, loader = prepare_loader()
    _app.prepare(
        port=port,
        workers=max(2, workers),
        host="127.0.0.1",
        motd=dev,
        motd_display=dict(version=__version__),
        dev=dev,
    )
    logger.debug("Serving at port: {}", port)
    Sanic.serve(primary=_app, app_loader=loader)


@handle_cli.command(
    short_help="Starts the server which would listen for your input",
    help="""
Starts the Handshake server to listen for inputs at the specified port on localhost. This command initiates a test run,
allowing the server to handle a single test run at a time. For multiple test runs, spawn the process separately on different
ports.
""",
)
@argument("PROJECT_NAME", nargs=1, required=True, type=str)
@observed_version
@general_but_optionally_present
@config_optional_path
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
    "-vb",
    "--verbose",
    default=False,
    show_default=True,
    help="shows even debug logs",
    is_flag=True,
)
@option(
    "-d",
    "--dev",
    default=False,
    show_default=True,
    help="Run the dev server ?",
    is_flag=True,
)
def run_app(
    collection_path: str,
    project_name: str,
    version: Union[str, bool],
    port: int,
    workers: int,
    verbose: bool,
    dev: bool,
    config_path: Optional[str] = None,
):
    break_if_mismatch(version)
    if not (verbose or dev):
        log_less()

    if workers < 2:
        logger.warning(
            "we have set default of 2 workers, if it's less than that, server might miss results sent from the runner."
        )

    P_Path(collection_path).mkdir(exist_ok=True)
    setup_app(
        project_name, collection_path, port, workers, dev, config_path=config_path
    )


@handle_cli.command(
    help="serves the generated reports. simply serves the static files generated in your directory mentioned "
    "in static_path",
    short_help="serves generated report",
)
@argument("STATIC_PATH", nargs=1, required=False, type=Path(exists=True, dir_okay=True))
@option(
    "-h",
    "--host",
    default="localhost",
    show_default=True,
    help="Host for the reports to be displayed at",
    type=str,
)
@option(
    "-p",
    "--port",
    default=8000,
    show_default=True,
    help="At this port you reports would be displayed",
    type=int,
)
def display(
    static_path: Union[str, P_Path] = "TestReports",
    port: int = 8000,
    host: str = "localhost",
):
    log_less()
    if static_path:
        static_path = P_Path(static_path)

        if not static_path.exists():
            raise NotADirectoryError(f"{static_path} does not exist")
    refer_from_here = TestConfigManager().get_config_for_command("DISPLAY")
    context = get_current_context()

    loader = AppLoader(factory=partial(feed_static_provider, static_path))
    _app = loader.load()
    _app.prepare(
        host=decide_value(context, "HOST", refer_from_here, host),
        port=decide_value(context, "PORT", refer_from_here, port),
        access_log=False,
        motd_display=dict(version=__version__),
    )
    Sanic.serve(primary=_app, app_loader=loader)


if __name__ == "__main__":
    setup_app("sample", "../../../TestResults", dev=True)
