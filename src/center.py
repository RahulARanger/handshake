from src.services.Endpoints.center import service_provider
from click import argument, option, Path, BadParameter
from pathlib import Path as P_Path
from src.handle_shipment import handle_cli
from multiprocessing.sharedctypes import Array
from src.services.DBService.lifecycle import init_tortoise_orm, close_connection, create_run, maintain_limits


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
    "-l", "--label", default="__UNASSOCIATED__", show_default=True,
    help="Label for your reports", type=str
)
@option(
    "-i", "--instances", default=1, show_default=True, help="Number of Instances used to run our Automation tests",
    type=int
)
@option(
    "-mr", "--max-reports", default=100, show_default=True, help="Max. Reports to save", type=int
)
def run_app(
        projectname: str,
        path: str, port: str, workers: int, fast: bool,
        label: str, instances: int,
        max_reports: int
):
    if not P_Path(path).is_dir():
        raise NotADirectoryError(path)
    if len(label) > 31:
        raise BadParameter("Please request if required more than 31 characters in a label")

    @service_provider.main_process_start
    async def get_me_started(app, loop):
        service_provider.shared_ctx.ROOT = Array('c', str.encode(path))
        await init_tortoise_orm()
        service_provider.shared_ctx.TEST_ID = Array('c', str.encode(await create_run(
            label, projectname, min(instances, 1)
        )))
        await maintain_limits(min(max_reports, 3))
        await close_connection()

    service_provider.run(
        port=port, workers=min(2, workers),
        host="127.0.0.1", fast=fast
    )
