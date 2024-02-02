from click import group, argument, Path as C_Path
from handshake.services.DBService.migrator import check_version, migration
from handshake.services.SchedularService.center import start_service
from handshake.services.SchedularService.lifecycle import start_loop
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
from handshake.services.DBService.lifecycle import (
    config_file,
)
from click import option
from pathlib import Path
from handshake.services.DBService.shared import db_path
from handshake.services.DBService.models.config_base import ConfigKeys
from tortoise import run_async


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
@handle_cli.command()
def migrate(collection_path: str):
    return migration(db_path(collection_path))


@handle_cli.command(
    short_help="Processes the collected results",
    help="""
Initiates a scheduler to standardize and enrich reports by patching suites and test runs with essential data often missing from various frameworks.
\nThe scheduler's primary task is to calculate aggregated values, such as the total number of executed suites and tests in a test run, addressing gaps in reporting. Furthermore, 
the scheduler identifies and compiles data crucial for dashboard visualization, particularly in the rollup 
process. This involves consolidating errors from child tests to the suite level and aggregating the number of 
tests from child suites to parent suites.
""",
)
@option(
    "--log-file",
    "-l",
    help="give me file name to store the logs for the patch command.",
    type=C_Path(),
    default="",
    required=False,
)
@general_requirement
def patch(collection_path, log_file: str):
    if log_file:
        logger.add(
            log_file if log_file.endswith(".log") else f"{log_file}.log",
            backtrace=True,
            diagnose=True,
        )

    if not Path(collection_path).is_dir():
        raise NotADirectoryError(collection_path)
    start_service(db_path(collection_path))
    start_loop()


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
        f" DB_PATH={relpath(saved_db_path, handshake)} npm run export",
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
        feed[ConfigKeys.maxRuns] = max_runs

    run_async(setConfig(saved_db_path, feed, set_default_first))
