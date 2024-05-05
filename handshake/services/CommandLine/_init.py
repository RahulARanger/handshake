import datetime
import pprint
from sqlite3 import connect, sqlite_version_info
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
    setConfig,
)
from loguru import logger
import json
from handshake.services.DBService.lifecycle import config_file, close_connection
from click import option
from pathlib import Path
from handshake.services.DBService.shared import db_path
from handshake.services.DBService.models.config_base import ConfigKeys
from tortoise import run_async
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
observed_version = option(
    "--version",
    "-v",
    default="",
    type=str,
    required=False,
    show_default=True,
    help="Used Internally with the reporters,"
    " reporters will pass the version of the expected handshake server if it matches,"
    " we run the server else we terminate the execution.",
)


def break_if_mismatch(expected: str) -> bool:
    if expected:
        assert expected.strip() == __version__, (
            f"Mismatch between expected version: {expected} "
            f"and the actual version v{__version__}"
        )
    return True


@general_requirement
@handle_cli.command()
def db_version(collection_path):
    return check_version(db_path(collection_path))


@handle_cli.command(
    short_help="checks the version of the sqlite3 installed in your system"
)
def check_sqlite():
    assert int(sqlite_version_info[0]) >= 3, "Required version is >= 3."
    assert (
        int(sqlite_version_info[1]) >= 38
    ), "Required Version is >= 3.38,  for supporting our sql scripts, for supporting our sql scripts"
    logger.info("your sqlite version is fine as per our need")


@general_requirement
@handle_cli.command(
    short_help="Migrates the database to the latest version as per the handshake executable.",
    help="it's a command to execute the required migration scripts, note; this command would be executed "
    "automatically whenever we run patch or run-app command",
)
def migrate(collection_path: str):
    return migration(db_path(collection_path))


@handle_cli.command(
    short_help="Processes the collected results and even could export the test results",
    help="runs an async loop, schedules some tasks to patch some your test results "
    "so you can see it in the way we need. you can pass the output directory to generate the report",
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
# TODO: Support the max runs feature, allows user to only export certain number of test runs
# @option(
#     "-mr",
#     "--max-runs",
#     type=int,
#     default=100,
#     help="Asks Sanic to set the use max. number of workers",
# )
@option(
    "--build",
    "-b",
    required=False,
    help="builds the dashboard output at the build output folder",
    type=C_Path(exists=True, file_okay=True, readable=True),
)
@option(
    "--include",
    "-i",
    required=False,
    help="generates the Import Data folder inside the test results (used for internal purposes only)",
    type=bool,
    is_flag=True,
    default=False,
    show_default=True,
)
@option("--out", "-o", type=C_Path(dir_okay=True, writable=True), required=False)
def patch(
    collection_path,
    log_file: str,
    reset: bool = False,
    build: str = None,
    out: str = None,
    include=False,
):
    if log_file:
        logger.add(
            log_file if log_file.endswith(".log") else f"{log_file}.log",
            backtrace=True,
            diagnose=True,
        )

    if not Path(collection_path).is_dir():
        raise NotADirectoryError(collection_path)

    scheduler = Scheduler(collection_path, out, reset, build, include)
    try:
        run(scheduler.start())
    except (KeyboardInterrupt, SystemExit):
        logger.warning("Scheduler terminated explicitly...")
        run(close_connection())


@handle_cli.command(
    help="returns the version of the handshake", short_help="example: 1.0.0"
)
def v():
    secho(__version__)


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
        "SELECT PROJECTNAME, ENDED FROM RUNBASE WHERE ENDED <> '' ORDER BY STARTED LIMIT 1"
        if not allow_pending
        else "SELECT PROJECTNAME, ENDED FROM RUNBASE ORDER BY STARTED LIMIT 1"
    ).fetchone()

    secho(
        "No Test Runs were found"
        if not result
        else (
            result[0],
            datetime.datetime.fromisoformat(result[1]).astimezone().strftime("%c %Z"),
        ),
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
