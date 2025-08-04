from .conftest import get_version
from handshake.services.DBService.models.enums import (
    MigrationStatus,
    MigrationTrigger,
)
from loguru import logger
from handshake.services.DBService.migrator import OLDEST_VERSION, revert_step_back
from pathlib import Path
from __test__.test_data_calc.test_migration.test_scripts import assert_migration
from pytest import fixture


@fixture()
def root_dir():
    return Path(__file__).parent.parent.parent.parent / "TestReversionRollback"


async def test_rollback_revert(get_vth_connection, db_path, root_dir):
    # we would be causing an error while executing the reversion
    # testing to see if the changes are committed or not (expectation: rollback)
    connection = await get_vth_connection(db_path, OLDEST_VERSION + 1)
    await connection.execute_query(
        "drop table suitebase;",
    )
    logger.info("We have reverted to: v{}", OLDEST_VERSION + 1)
    # we will run the wrong reversion script and see what would happen. 😈

    # oldest version: v5, but we are trying to revert v6 to v5
    assert not revert_step_back(
        OLDEST_VERSION + 1,
        db_path,
    ), "it should have rolled back"

    # we cannot query configbase from orm as there is a schema mismatch with the older versions
    assert (
        int(await get_version()) == OLDEST_VERSION + 1
    )  # no changes were made apart from corruption I did

    record = await assert_migration(
        OLDEST_VERSION + 1,
        OLDEST_VERSION,
        MigrationStatus.FAILED,
        MigrationTrigger.CLI,
    )
    assert "no such table: suitebase" in record.error
