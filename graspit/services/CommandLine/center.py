import pprint

from graspit.services.CommandLine.core import handle_cli, general_requirement
from graspit.services.DBService.lifecycle import init_tortoise_orm, close_connection
from click import option
from loguru import logger
from pathlib import Path
from typing import Dict
from graspit.services.SchedularService.center import start_service
from graspit.services.DBService.shared import db_path
from graspit.services.DBService.models.config_base import ConfigKeys, ConfigBase
from graspit.services.SchedularService.lifecycle import start_loop
from tortoise import run_async
from tortoise.expressions import Q


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
@general_requirement
def patch(collection_path):
    if not Path(collection_path).is_dir():
        raise NotADirectoryError(collection_path)
    start_service(db_path(collection_path))
    start_loop()


async def setConfig(path: Path, feed: Dict[ConfigKeys, str]):
    await init_tortoise_orm(path)

    if feed:
        to_change = await ConfigBase.filter(Q(key__in=feed.keys())).all()
        for to in to_change:
            to.value = feed[to.key]
            await ConfigBase.bulk_update(to_change, fields=["value"])
        logger.info("Modified the requested values")

    pprint.pprint(await ConfigBase.all().values_list(), indent=4)
    await close_connection()


@handle_cli.command(
    short_help="Quick Config for test collection",
    help="configures few values which is used while processing your reports., ignore the options if not required for "
    "update",
)
@general_requirement
@option(
    "--max_runs",
    "-mr",
    default=-1,
    help="Max. Number of runs to keep. NOTE: should be >1",
)
def config(collection_path, max_runs):
    saved_db_path = db_path(collection_path)
    if not saved_db_path.exists():
        raise FileNotFoundError(f"DB file not in {collection_path}")

    feed = dict()
    if max_runs > 1:
        feed[ConfigKeys.maxRuns] = max_runs

    run_async(setConfig(saved_db_path, feed))
