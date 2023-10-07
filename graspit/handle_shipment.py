from typing import List
from click import group, Path as C_Path, argument, option
from pathlib import Path
from graspit.services.SchedularService.center import start_service
from graspit.services.DBService.shared import db_path
from graspit.services.DBService.lifecycle import init_tortoise_orm, close_connection
from graspit.services.SchedularService.lifecycle import start_loop
from graspit.services.DBService.models.config_base import ExportBase, RunBase
from tortoise.functions import Max
from os.path import relpath
from click import secho
from subprocess import call, check_output
from tortoise import run_async


@group()
def handle_cli():
    pass


@handle_cli.command()
@argument(
    "path",
    nargs=1,
    type=C_Path(exists=True, dir_okay=True),
    required=False,
    default=Path.cwd(),
)
def patch(path):
    if not Path(path).is_dir():
        raise NotADirectoryError(path)
    start_service(db_path(path))
    start_loop()


async def createExportTicket(
    maxTestRuns: int, isDynamic: bool, path: Path, store: List[str]
):
    await init_tortoise_orm(path)

    recent_record = await RunBase.annotate(recent_record=Max("ended")).first()
    ticket = await ExportBase.create(
        maxTestRuns=maxTestRuns, isDynamic=isDynamic, test_id=recent_record.testID
    )

    await close_connection()
    store.append(ticket.ticketID)


@handle_cli.command()
@argument("path", nargs=1, type=C_Path(exists=True, dir_okay=True), required=True)
@option(
    "-r",
    "--runs",
    type=int,
    default=100,
    help="Asks Sanic to set the use max. number of workers",
)
@option(
    "-d",
    "--dynamic",
    default=False,
    is_flag=True,
    type=bool,
    show_default=True,
)
@option("--out", type=C_Path(dir_okay=True), required=True)
def export(path, runs, dynamic, out):
    saved_db_path = db_path(path)
    if not saved_db_path.exists():
        raise FileNotFoundError(f"DB file not in {path}")

    resolved = Path(out).resolve()

    secho(f"Currently at: {Path.cwd()}", fg="yellow")
    node_modules = check_output(
        "npm root", shell=True, text=True, cwd=Path.cwd()
    ).strip()
    secho(f"Found Node modules at: {node_modules}", fg="yellow")

    graspit = Path(node_modules) / "graspit"
    if not graspit.exists():
        secho(
            f"graspit was not found in {graspit} please try this command, npm install graspit",
            fg="red",
        )
        raise FileNotFoundError(
            "Please install graspit in your project, npm install graspit"
        )

    secho("Given details are valid, creating a export ticket", fg="green")

    ticket_i_ds = []
    run_async(createExportTicket(runs, dynamic, saved_db_path, ticket_i_ds))

    if len(ticket_i_ds) == 0:
        secho("Ticket was not created, please report this issue", fg="red")

    secho(f"Exporting results to {relpath(resolved, graspit)}", fg="yellow")
    secho(
        f'Raising a request with command: "npx cross-env TICKET_ID={ticket_i_ds[0]} EXPORT_DIR={relpath(resolved, graspit)}'
        f' DB_PATH={relpath(saved_db_path, graspit)} npm run export"',
        fg="blue",
    )

    call(
        f"npx cross-env TICKET_ID={ticket_i_ds[0]} EXPORT_DIR={relpath(resolved, graspit)}"
        f" DB_PATH={relpath(saved_db_path, graspit)} npm run export",
        cwd=graspit,
        shell=True,
    )


if __name__ == "__main__":
    start_service(db_path("../TestResults"))
    start_loop()
