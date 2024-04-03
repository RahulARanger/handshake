import datetime
import pprint
from sqlite3 import connect
from click import (
    group,
    argument,
    secho,
    version_option,
    pass_context,
    Context,
    Path as C_Path,
)
from handshake import __version__
from handshake.services.DBService.migrator import check_version, migration, DB_VERSION
from handshake.services.SchedularService.start import Scheduler
from handshake.services.SchedularService.handleTestResults import (
    moveTestRunsRelatedAttachment,
    setConfig,
)
from functools import partial
from handshake.services.SchedularService.constants import writtenAttachmentFolderName
from handshake.services.SchedularService.register import (
    deleteExportTicket,
    createExportTicket,
)
from os.path import relpath
from subprocess import call, check_output
from loguru import logger
from concurrent.futures import ThreadPoolExecutor
import json
from handshake.services.DBService.lifecycle import config_file, close_connection
from click import option
from pathlib import Path
from handshake.services.DBService.shared import db_path
from handshake.services.DBService.models.config_base import ConfigKeys
from tortoise import run_async
from os import getenv
from asyncio import run


@group(
    name="Handshake",
    short_help="Handshake command",
    help=f"""

{'{:*^69}'.format(" Welcome to Handshake's CLI ")}

Handshake simplifies the collection and processing of your test results. The Handshake CLI helps you to interact with 
the stored results or with the server. so for each command it requires a <path> argument, representing the collection 
folder, a place where you could have the database or were planning to store the results [not the HTML files].

[ROOT-DIR] >> [COLLECTION_NAME] (*we need this) >> TeStReSuLtS.db & [Attachments] (for getting this).

{'{:*^69}'.format(" Glossary ")}
""",
)
@version_option(f"{__version__}, DB: {DB_VERSION}")
def handle_cli():
    pass


general_requirement = argument(
    "COLLECTION_PATH", nargs=1, type=C_Path(exists=True, dir_okay=True), required=True
)
general_but_optional_requirement = argument(
    "COLLECTION_PATH", nargs=1, type=C_Path(dir_okay=True), required=True
)


@general_requirement
@handle_cli.command()
def db_version(collection_path):
    return check_version(db_path(collection_path))


@general_requirement
@handle_cli.command(
    short_help="Migrates the database to the latest version as per the handshake executable.",
    help="it's a command to execute the required migration scripts, note; this command would be executed "
    "automatically whenever we run patch or run-app command",
)
def migrate(collection_path: str):
    return migration(db_path(collection_path))


@handle_cli.command(
    short_help="Processes the collected results",
    help="runs an async scheduler, thanks to apscheduler, it would process your test results to patch some missing "
    "values. which are essential while showcasing your test reports",
)
@option(
    "--log-file",
    "-l",
    help="give me file name to store the logs for the patch command.",
    type=C_Path(),
    default="",
    required=False,
)
@option(
    "-r",
    "--reset",
    default=False,
    show_default=True,
    help="re-calculates the values for the test runs",
    type=bool,
    is_flag=True,
)
@general_requirement
def patch(collection_path, log_file: str, reset: bool = False):
    if log_file:
        logger.add(
            log_file if log_file.endswith(".log") else f"{log_file}.log",
            backtrace=True,
            diagnose=True,
        )

    if not Path(collection_path).is_dir():
        raise NotADirectoryError(collection_path)
    # start_service(db_path(collection_path), reset)

    scheduler = Scheduler(collection_path, None, reset)
    try:
        run(scheduler.start())
    except (KeyboardInterrupt, SystemExit):
        run(close_connection())


@handle_cli.command(
    help="returns the version of the handshake", short_help="example: 1.0.0"
)
def v():
    secho(__version__)


@handle_cli.command(
    help="Helper command which would assume you have nodejs installed and with the help of Next.js's SSG [Static Site "
    "Generation] we would generate reports from processed results."
    " Note: make sure to run this command from the directory where we can access the required npm scope",
    short_help="Generates the static dashboard from processed results",
)
@general_requirement
@option(
    "-mr",
    "--max-runs",
    type=int,
    default=100,
    help="Asks Sanic to set the use max. number of workers",
)
@option("--out", type=C_Path(dir_okay=True), required=True)
@option("--clarity", is_flag=True)
def export(collection_path, max_runs, out, clarity):
    saved_db_path = db_path(collection_path)
    if not saved_db_path.exists():
        raise FileNotFoundError(f"DB file not in {collection_path}")

    resolved = Path(out).resolve()
    resolved.mkdir(exist_ok=True)

    logger.debug(
        "we are currently at: {}. assuming npm in scope, finding dashboard lib.",
        Path.cwd(),
    )

    node_modules = check_output(
        "npm root", shell=True, text=True, cwd=Path.cwd()
    ).strip()

    logger.info("Found Node modules at: {}", node_modules)

    handshake = Path(node_modules) / "handshake-dashboard"
    if not handshake.exists():
        logger.error(
            "handshake-dashboard was not found in packages located at {}. please try to install the dashboard through "
            "the command: npm install handshake",
            handshake,
        )
        raise FileNotFoundError(
            "Please install handshake-dashboard in your project, npm install handshake"
        )

    logger.debug("Given details are valid, creating a export ticket")

    ticket_i_ds = []
    runs = []
    run_async(createExportTicket(max_runs, saved_db_path, ticket_i_ds, runs, clarity))

    if len(ticket_i_ds) == 0:
        logger.error("Ticket was not created, please report this as a issue.")

    logger.info("Exporting results to {}", relpath(resolved, handshake))
    logger.debug(
        "building files, with command:"
        ' "npx cross-env TICKET_ID={} EXPORT_DIR={}'
        ' DB_PATH={} npm run export"',
        ticket_i_ds[0],
        relpath(resolved, handshake),
        relpath(saved_db_path, handshake),
    )

    exported = call(
        f"npx cross-env TICKET_ID={ticket_i_ds[0]} EXPORT_DIR={relpath(resolved, handshake)}"
        f" DB_PATH={relpath(saved_db_path, handshake)} CLARITY={getenv('CLARITY')} npm run export",
        cwd=handshake,
        shell=True,
    )

    if ticket_i_ds:
        run_async(deleteExportTicket(ticket_i_ds[0]))

    attachments = Path(out) / writtenAttachmentFolderName
    attachments.mkdir(exist_ok=True)

    attachments_from = Path(collection_path) / writtenAttachmentFolderName

    if not (Path(out).exists() and exported == 0 and attachments_from.exists()):
        return logger.warning("Task for copying attachments was skipped.")

    allocated_work = partial(
        moveTestRunsRelatedAttachment, copyFrom=attachments_from, copyTo=attachments
    )

    with ThreadPoolExecutor(max_workers=6) as workers:
        logger.info("Copying attachments for {} test runs.", len(runs))
        workers.map(allocated_work, runs)

    logger.info("Done.")


@handle_cli.command(
    short_help="Quick Config for test collection",
    help="configures few values which is used while processing your reports., ignore the options if not required for "
    "update",
)
@general_but_optional_requirement
@option(
    "--max_runs",
    "-mr",
    default=-1,
    help="Max. Number of runs to keep. NOTE: should be >1",
)
def config(collection_path, max_runs):
    saved_db_path = db_path(collection_path)

    set_default_first = not Path(collection_path).exists()
    if set_default_first:
        Path(collection_path).mkdir(exist_ok=True)

    feed_from = config_file(saved_db_path)
    feed = dict() if not feed_from.exists() else json.loads(feed_from.read_text())
    if max_runs > 1:
        feed[ConfigKeys.maxRunsPerProject] = max_runs

    run_async(setConfig(saved_db_path, feed, set_default_first))


@handle_cli.group(
    name="db",
    short_help="Commands that will/(try to) fetch mostly asked info. from db",
    help="you can query using db following the subcommands, which are created to provide mostly asked info. from db",
)
@version_option(DB_VERSION, prog_name="handshake-db")
@general_requirement
def db(collection_path: str):
    if not Path(db_path(collection_path)).exists():
        raise FileNotFoundError(
            f"db path was not found in the collections: {collection_path}"
        )


@db.command(short_help="fetches the timestamp of the latest run")
@option(
    "-p",
    "--allow-pending",
    default=False,
    show_default=True,
    help="consider runs, whose status are pending",
    type=bool,
    is_flag=True,
)
@pass_context
def latest_run(ctx: Context, allow_pending: bool):
    db_file = db_path(Path(ctx.parent.params["collection_path"]))
    pipe = connect(db_file)
    result = pipe.execute(
        "SELECT ENDED FROM RUNBASE WHERE ENDED <> '' ORDER BY STARTED LIMIT 1"
        if not allow_pending
        else "SELECT ENDED FROM RUNBASE ORDER BY STARTED LIMIT 1"
    ).fetchone()

    secho(
        "No Test Runs were found"
        if not result
        else datetime.datetime.fromisoformat(result[0]).astimezone().strftime("%c %Z"),
        fg="bright_yellow" if not result else "bright_magenta",
    )

    pipe.close()


@db.command(
    short_help="fetches the number of yet to patch task",
    help="returns list of tasks of form: (ticket_id, task_type, dropped_date, is_picked, test_id)",
)
@pass_context
def yet_to_process(ctx: Context):
    db_file = db_path(Path(ctx.parent.params["collection_path"]))
    pipe = connect(db_file)
    result = pipe.execute(
        "SELECT ticketID, type, STRFTIME('%d/%m/%Y, %H:%M', dropped, 'localtime'), picked, test_id FROM TASKBASE WHERE "
        "PROCESSED = 0"
    ).fetchall()

    secho(
        "No Pending Tasks"
        if not result
        else f"pending tasks:\n {pprint.pformat(result)}",
        fg="bright_green" if not result else "bright_yellow",
    )

    pipe.close()
