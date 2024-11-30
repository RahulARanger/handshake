import datetime
import pprint
import sqlite3
from sqlite3 import connect, sqlite_version_info
from click import (
    group,
    argument,
    secho,
    version_option,
    pass_context,
    Context,
    Path as C_Path,
    confirm,
)
from shutil import make_archive, move, unpack_archive
from tortoise import run_async
from handshake import __version__
from handshake.services.DBService.migrator import (
    check_version,
    migration,
    revert_step_back,
    DB_VERSION,
    MigrationTrigger,
)
from handshake.services.SchedularService.start import Scheduler
from loguru import logger
from handshake.services.DBService.lifecycle import close_connection, init_tortoise_orm
from handshake.services.DBService.merge import Merger
from click import option
from pathlib import Path
from handshake.services.DBService.shared import db_path
from asyncio import run
from typing import Optional


@group(
    name="Handshake",
    short_help="Handshake command",
    help=f"""

{'{:*^69}'.format(" Welcome to Handshake's CLI ")}

Handshake simplifies the collection and processing of your test results. The Handshake CLI helps you to interact with the stored results or with the server. so for each command it requires a <path> argument, representing the collection 
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
general_but_optionally_present = argument(
    "COLLECTION_PATH", nargs=1, type=C_Path(dir_okay=True), required=True
)
config_optional_path = argument(
    "CONFIG_PATH", nargs=1, type=C_Path(dir_okay=True), required=False
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
@handle_cli.command(
    short_help="Returns the version inside the TestResults",
    help="it would be possible the server and stored results are in different version, "
    "with this command you can clear that query and note if migration is required",
)
def db_version(collection_path):
    return check_version(path=db_path(collection_path), is_auto=True)


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
    return migration(db_path(collection_path), MigrationTrigger.CLI)


@general_requirement
@handle_cli.command(
    short_help="To revert db's version one step back. USE IT WITH CAUTION",
    help="you might need to use this if you are planning to use previous version python build."
    " Make sure to understand why this command is useful and how it would impact."
    " After this command, if db version was in v8 it would not be in v7",
)
def step_back(collection_path: str):
    path_to_refer = db_path(collection_path)
    from_version = (check_version(path=path_to_refer, is_auto=True))[-1]
    if confirm(f"Do you want revert from v{from_version} to v{from_version - 1}"):
        return revert_step_back(from_version, path_to_refer)


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
@config_optional_path
@option(
    "--build",
    "-b",
    required=False,
    help="builds the dashboard output at the build output folder",
    type=C_Path(exists=True, file_okay=True, readable=True),
)
@option(
    "--inside",
    "-i",
    required=False,
    help="generates the export inside the TestResults itself",
    type=bool,
    is_flag=True,
    default=False,
    show_default=True,
)
@option(
    "--out",
    "-o",
    help="generates the export at this desired place",
    type=C_Path(dir_okay=True, writable=True),
    required=False,
)
@option(
    "--export_mode",
    "-e",
    help="generates either json/html export",
    type=str,
    required=False,
    default="json",
)
@option(
    "--xlsx",
    "-xl",
    help="generates excel export of the test run",
    required=False,
    is_flag=True,
    default=False,
    show_default=True,
)
@option(
    "--dev",
    "-d",
    required=False,
    help="This is used only for testing purposes, please do not use this flag",
    is_flag=True,
    default=False,
    show_default=False,
)
def patch(
    collection_path,
    log_file: str,
    reset: bool = False,
    build: str = None,
    config_path: Optional[str] = None,
    out: str = None,
    dev: bool = False,
    inside=False,
    export_mode: str = "json",
    xlsx: bool = False,
):
    if log_file:
        logger.add(
            log_file if log_file.endswith(".log") else f"{log_file}.log",
            backtrace=True,
            diagnose=True,
        )

    if not Path(collection_path).is_dir():
        raise NotADirectoryError(collection_path)

    scheduler = Scheduler(
        collection_path, out, reset, build, inside, dev, export_mode, xlsx
    )
    try:
        run(scheduler.start(config_path))
    except (KeyboardInterrupt, SystemExit):
        logger.warning("Scheduler terminated explicitly...")
        run(close_connection())


@handle_cli.command(
    short_help="zips your TestResults in a tar file",
    help="it zips your TestResults in a single tar file with bz2 compression level."
    " it stores only inside the provided TestResults folder but not the TestResults folder itself.",
)
@general_requirement
@option(
    "--out",
    "-o",
    help="Saves the zipped file inside this folder path",
    type=C_Path(dir_okay=True),
    required=False,
    default=None,
)
def zip_results(collection_path, out=None):
    collection = Path(collection_path)
    output_folder = Path(out).resolve() if out else Path.cwd()
    output_folder.mkdir(exist_ok=True)

    logger.info(f"compressing TestResults located at: {collection}")
    file_name = collection.stem + ".tar.bz2"
    before = (output_folder / file_name).exists()
    if before:
        logger.error(
            f"output file already exists, Please remove or rename the file at {output_folder / file_name}",
        )

    else:
        make_archive(collection.stem, "bztar", collection)
        if out:
            move(file_name, output_folder)
        logger.info(f"Done, located at {output_folder / file_name}")


@handle_cli.command(
    short_help="extracts zipped (.bz2) TestResults into a provided folder",
    help="extracts zipped TestResults into a provided folder. "
    "we assume that the results were zipped in a tar file with bz2 compression",
)
@argument(
    "file",
    type=C_Path(file_okay=True, readable=True, exists=True),
    required=True,
)
@option(
    "--out",
    "-o",
    help="Extracts results inside this folder",
    type=C_Path(dir_okay=True, writable=True),
    required=False,
)
def extract_results(file: str, out: str):
    output_folder = Path(out if out else file.split(".")[0])
    logger.info(f"de-compressing {file}")
    unpack_archive(file, output_folder, "bztar")
    logger.info(f"Done, located at {output_folder}")


@handle_cli.command(
    short_help="merges all the provided results into the single one. Simple Merge",
    help="It's a simple merge, it takes in either zip file of your TestResults or a folder itself "
    "and then it takes a copy, migrates if required and then inserts data into the output database."
    " Please note we would also run migration scripts on the output TestResults. Temp folders are then deleted.",
)
@argument(
    "output",
    type=C_Path(dir_okay=True, writable=True, exists=False),
    required=True,
)
@option(
    "-m",
    "--merge-with",
    required=True,
    multiple=True,
    help="provide the compressed path of the results folder",
)
def merge(output, merge_with):
    merger = Merger(output)
    merger.start(merge_with)


@handle_cli.command(
    help="returns the version of the handshake", short_help="example: 1.0.0"
)
def v():
    secho(__version__)


@handle_cli.command(
    short_help="does the required setup to store your test results in this folder",
    help="""
Configures TestResults folder with the provided folder name at your cwd. 
Example: handshake init TestResults, at your cwd: x,\n
then it creates x -> TestResults -> TeStReSuLtS.sb and x -> TestResults -> Attachments
and x -> handshakes.json
    """,
)
@general_but_optionally_present
@config_optional_path
def init(collection_path, config_path=None):
    saved_db_path = db_path(collection_path)

    set_default_first = not Path(collection_path).exists()
    if set_default_first:
        Path(collection_path).mkdir(exist_ok=True)

    run_async(
        init_tortoise_orm(
            saved_db_path,
            True,
            close_it=True,
            init_script=True,
            config_path=config_path,
        )
    )


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
        "SELECT PROJECTNAME, STRFTIME('%d/%m/%Y, %H:%M', STARTED, 'localtime') as STARTED, "
        "STRFTIME('%d/%m/%Y, %H:%M', ENDED, 'localtime') as ENDED, TESTID"
        " FROM RUNBASE WHERE ENDED <> '' ORDER BY STARTED LIMIT 1"
        if not allow_pending
        else "SELECT PROJECTNAME, STRFTIME('%d/%m/%Y, %H:%M', STARTED, 'localtime') as STARTED,"
        " STRFTIME('%d/%m/%Y, %H:%M', ENDED, 'localtime') as ENDED, TESTID FROM RUNBASE ORDER BY STARTED LIMIT 1"
    )

    row = result.fetchone()
    secho(
        (
            "No Test Runs were found"
            if not row
            else (pprint.pformat(list(zip(row, [_[0] for _ in result.description]))))
        ),
        fg="bright_yellow" if not row else "bright_magenta",
    )

    pipe.close()


@db.command(short_help="fetches the results from the sqlite database")
@argument(
    "q",
    default=False,
    type=str,
)
@pass_context
def query(ctx: Context, q: str):
    db_file = db_path(Path(ctx.parent.params["collection_path"]))
    try:
        import tabulate
    except ImportError:
        return logger.error(
            "could not execute the provided query, Please install this package by"
            ' pip install "handshakes[print-tables]"'
        )
    if not q.lower().startswith("select"):
        return logger.warning(
            "we do not support & recommend modifying the values through this command, only select commands are allowed"
        )

    with connect(db_file) as pipe:
        try:
            rows = pipe.execute(q)
        except sqlite3.OperationalError:
            return logger.exception("Failed to execute the query, Please check once, ")

        result = []
        for row in rows.fetchall()[:20]:
            result.append([])
            for cell in row:
                result[-1].append(cell if cell is not None else "")

        column_names = [description[0] for description in rows.description]
        if result:
            print(
                tabulate.tabulate(
                    result,
                    headers=column_names,
                    tablefmt="rounded_grid",
                    maxheadercolwidths=12,
                    maxcolwidths=12,
                )
            )
        secho(f"Returned {len(result)} rows.", fg="green")


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
        (
            "No Pending Tasks"
            if not result
            else f"pending tasks:\n {pprint.pformat(result)}"
        ),
        fg="bright_green" if not result else "bright_yellow",
    )

    pipe.close()


if __name__ == "__main__":
    _scheduler = Scheduler(
        "../../../TestResults", manual_reset=True, include_excel_export=True
    )
    try:
        run(_scheduler.start())
    except (KeyboardInterrupt, SystemExit):
        logger.warning("Scheduler terminated explicitly...")
        run(close_connection())
