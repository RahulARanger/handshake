import json
import pprint
import typing

from handshake.services.CommandLine.core import (
    handle_cli,
    general_but_optional_requirement,
)
from handshake.services.CommandLine._init import general_requirement
from handshake.services.DBService.lifecycle import (
    init_tortoise_orm,
    close_connection,
    set_default_config,
    config_file,
)
from click import option
from pathlib import Path
from typing import Dict
from handshake.services.SchedularService.center import start_service
from handshake.services.DBService.shared import db_path
from handshake.services.DBService.models.config_base import ConfigKeys, ConfigBase
from handshake.services.SchedularService.lifecycle import start_loop
from tortoise import run_async
from tortoise.expressions import Q


def dump_config(path: Path, to_dump: typing.List):
    formatted_dump: typing.Dict[str, str] = dict(to_dump)
    formatted_dump.pop(ConfigKeys.version)
    if ConfigKeys.recentlyDeleted in formatted_dump:
        formatted_dump.pop(ConfigKeys.recentlyDeleted)
    config_file(path).write_text(json.dumps(formatted_dump, indent=4))


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


async def setConfig(path: Path, feed: Dict[ConfigKeys, str], set_default: bool):
    await init_tortoise_orm(path)

    if set_default:
        await set_default_config(path)
    if feed:
        to_change = await ConfigBase.filter(Q(key__in=feed.keys())).all()
        for to in to_change:
            to.value = feed[to.key]
            await ConfigBase.bulk_update(to_change, fields=["value"])

    to_dump = await ConfigBase.all().values_list()
    dump_config(path, to_dump)
    print("Current dump;")
    pprint.pprint(to_dump, indent=4)
    await close_connection()


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
