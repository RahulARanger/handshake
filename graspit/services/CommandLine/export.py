from graspit.services.CommandLine._init import handle_cli, general_requirement
from graspit.services.DBService.shared import db_path
from graspit.services.DBService.lifecycle import init_tortoise_orm, close_connection
from graspit.services.DBService.models.config_base import ExportBase
from os.path import relpath
from subprocess import call, check_output
from tortoise import run_async
from click import option, Path as C_Path
from pathlib import Path
from typing import List
from loguru import logger


# TODO: Handle a case where there are records in the RunBase
async def createExportTicket(maxTestRuns: int, path: Path, store: List[str]):
    await init_tortoise_orm(path)
    ticket = await ExportBase.create(maxTestRuns=maxTestRuns)

    await close_connection()
    store.append(str(ticket.ticketID))


@handle_cli.command(
    help="Helper command which would assume you have nodejs installed and with the help of Next.js's SSG [Static Site "
    "Generation] we would generate reports from processed results."
    " Note: make sure to run this command from the directory where we can access the required npm scope",
    short_help="Generates the static dashboard from processed results",
)
@general_requirement
@option(
    "-r",
    "--runs",
    type=int,
    default=100,
    help="Asks Sanic to set the use max. number of workers",
)
@option("--out", type=C_Path(dir_okay=True), required=True)
def export(collection_path, runs, out):
    saved_db_path = db_path(collection_path)
    if not saved_db_path.exists():
        raise FileNotFoundError(f"DB file not in {collection_path}")

    resolved = Path(out).resolve()
    resolved.mkdir(exist_ok=True)

    logger.info("Currently at: {}", Path.cwd())

    node_modules = check_output(
        "npm root", shell=True, text=True, cwd=Path.cwd()
    ).strip()

    logger.warning("Found Node modules at: {}", node_modules)

    graspit = Path(node_modules) / "graspit"
    if not graspit.exists():
        logger.error(
            "graspit was not found in {} please try this command, npm install graspit",
            graspit,
        )
        raise FileNotFoundError(
            "Please install graspit in your project, npm install graspit"
        )

    logger.info("Given details are valid, creating a export ticket")

    ticket_i_ds = []
    run_async(createExportTicket(runs, saved_db_path, ticket_i_ds))

    if len(ticket_i_ds) == 0:
        logger.error("Ticket was not created, please report this as a issue")

    logger.info("Exporting results to {}", relpath(resolved, graspit))
    logger.info(
        "Raising a request with command:"
        ' "npx cross-env TICKET_ID={} EXPORT_DIR={}'
        ' DB_PATH={} npm run export"',
        ticket_i_ds[0],
        relpath(resolved, graspit),
        relpath(saved_db_path, graspit),
    )

    call(
        f"npx cross-env TICKET_ID={ticket_i_ds[0]} EXPORT_DIR={relpath(resolved, graspit)}"
        f" DB_PATH={relpath(saved_db_path, graspit)} npm run export",
        cwd=graspit,
        shell=True,
    )

    # TODO: delete the export ticket
