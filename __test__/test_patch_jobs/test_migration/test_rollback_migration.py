from .conftest import get_version
from handshake.services.DBService.models.enums import (
    MigrationStatus,
    MigrationTrigger,
)
from handshake.services.DBService.migrator import (
    migration,
    DB_VERSION,
    OLDEST_VERSION,
)
from pathlib import Path
from __test__.test_patch_jobs.test_migration.test_scripts import assert_migration
from pytest import fixture


@fixture()
def root_dir():
    return Path(__file__).parent.parent.parent.parent / "TestMigrationRollback"


async def test_rollback_migration(get_vth_connection, db_path, root_dir):
    # we would be causing an error while executing the migration
    # testing to see if the changes are committed or not (expectation: rollback)
    connection = await get_vth_connection(db_path, OLDEST_VERSION)
    await connection.execute_query(
        "drop table taskbase;",
    )
    # we corrupt the database and see what would happen. 😈

    assert not migration(
        db_path,
    ), "it should have rolled back"

    # we cannot query configbase from orm as there is a schema mismatch with the older versions
    assert (
        int(await get_version()) == OLDEST_VERSION
    )  # no changes were made apart from corruption I did

    record = await assert_migration(
        OLDEST_VERSION, DB_VERSION, MigrationStatus.FAILED, MigrationTrigger.AUTOMATIC
    )
    assert "no such table: taskbase" in record.error
