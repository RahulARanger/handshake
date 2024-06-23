import sqlite3
import tortoise
from handshake.services.DBService.models import (
    ConfigBase,
    TestLogBase,
    TaskBase,
    MigrationBase,
)
from .conftest import get_version, get_config_value
from handshake.services.DBService.models.enums import (
    ConfigKeys,
    MigrationStatus,
    MigrationTrigger,
)
from handshake.services.DBService.migrator import (
    migration,
    DB_VERSION,
    OLDEST_VERSION,
    revert_step_back,
)
from subprocess import run, PIPE


async def assertEntityNameType(connection, expected):
    info = await connection.execute_query("PRAGMA table_info('SessionBase');")

    found = False
    for row in info[1]:
        if row["name"] == "entityName":
            found = True
            assert row["type"] == expected
    assert found, "entityName not found"


async def assert_migration(fromVersion, toVersion, status, trigger):
    record = await MigrationBase.all().order_by("-id").first()
    assert record.fromVersion == fromVersion, dict(record)
    assert record.toVersion == toVersion, dict(record)
    assert record.status == status, dict(record)
    assert record.trigger == trigger, dict(record)
    return record


class TestMigrationScripts:
    async def test_sqlite_version(self):
        assert int(sqlite3.sqlite_version_info[0]) >= 3
        assert int(sqlite3.sqlite_version_info[1]) >= 38

    async def test_bump_v5(
        self,
        sample_test_session,
        create_suite,
        get_vth_connection,
        scripts,
        db_path,
    ):
        await get_vth_connection(db_path, 5)

        session = await sample_test_session
        test_run = await session.test

        # based on the previous test we are now in version: 5
        assert int(await get_version()) == 5

        script = scripts / "bump-v5.sql"
        assert script.exists()

        suite = await create_suite(session.sessionID)
        await tortoise.connections.get("default").execute_query(
            'INSERT INTO "taskbase" ("ticketID","type","dropped","meta","picked","test_id") VALUES (?,?,?,?,?,?)',
            [
                str(suite.suiteID),
                "fix-suite",
                "2024-02-07 19:46:39.059284+00:00",
                "{}",
                0,
                str(test_run.testID),
            ],
        )
        # you cannot use this because processed col is not there yet.
        # await register_patch_suite(suite.suiteID, test_run.testID)

        assert migration(db_path, do_once=True), "we still have further migration to go"

        await assert_migration(5, 6, MigrationStatus.PASSED, MigrationTrigger.AUTOMATIC)

        assert (await TaskBase.filter(ticketID=suite.suiteID).first()).picked == 0
        # new column: processed, is added.
        assert (await TaskBase.filter(ticketID=suite.suiteID).first()).processed == 0

    async def test_bump_v6(
        self, get_vth_connection, scripts, db_path, sample_test_session
    ):
        await get_vth_connection(db_path, 6)
        assert migration(
            db_path, do_once=True
        ), "it should now be in the latest version"
        await assert_migration(6, 7, MigrationStatus.PASSED, MigrationTrigger.AUTOMATIC)

        # relies on init_job to complete the migration
        assert (await get_config_value(ConfigKeys.reset_test_run)) == "1"

        logs = await TestLogBase.all().values("dropped")
        assert len(logs) >= 0

    async def test_bump_v7(
        self, get_vth_connection, scripts, db_path, sample_test_session
    ):
        await get_vth_connection(db_path, 7)
        assert migration(
            db_path, do_once=True
        ), "it should now be in the latest version"
        await assert_migration(7, 8, MigrationStatus.PASSED, MigrationTrigger.AUTOMATIC)

        assert (await ConfigBase.filter(key=ConfigKeys.version).first()).value == "8"

        assert (await ConfigBase.filter(key=ConfigKeys.version).first()).readonly
        assert (
            await ConfigBase.filter(key=ConfigKeys.recentlyDeleted).first()
        ).readonly
        assert (await ConfigBase.filter(key=ConfigKeys.reset_test_run).first()).readonly
        assert not (
            await ConfigBase.filter(key=ConfigKeys.maxRunsPerProject).first()
        ).readonly

    async def test_bump_v8(
        self, get_vth_connection, scripts, db_path, sample_test_session
    ):
        await get_vth_connection(db_path, 8)
        assert migration(
            db_path, do_once=True
        ), "it should now be in the latest version"
        await assert_migration(8, 9, MigrationStatus.PASSED, MigrationTrigger.AUTOMATIC)

        assert (await ConfigBase.filter(key=ConfigKeys.version).first()).value == "9"
        # nothing much here we are just dropping table: "ExportBase" it was used long before v3

    # say you are in v8 and have reverted your python build to older version which uses v7
    # question: how does migrate function work ?

    async def test_version_command(self, root_dir):
        result = run(f'handshake db-version "{root_dir}"', shell=True, stderr=PIPE)
        assert result.returncode == 0
        assert f"Currently at: v{DB_VERSION}." in result.stderr.decode()

    async def test_migration_command(
        self, get_vth_connection, root_dir, scripts, db_path
    ):
        await get_vth_connection(db_path, OLDEST_VERSION)
        result = run(f'handshake migrate "{root_dir}"', shell=True, stderr=PIPE)
        await assert_migration(
            OLDEST_VERSION, DB_VERSION, MigrationStatus.PASSED, MigrationTrigger.CLI
        )
        assert result.returncode == 0
        assert f"Migrated to latest version v{DB_VERSION}!" in result.stderr.decode()

    async def test_revert_step_back(self, get_vth_connection, db_path):
        await get_vth_connection(db_path, 7)
        assert (await get_version()) == "7"
        revert_step_back(7, db_path)
        await assert_migration(7, 6, MigrationStatus.PASSED, MigrationTrigger.CLI)
        assert (await get_version()) == "6"
