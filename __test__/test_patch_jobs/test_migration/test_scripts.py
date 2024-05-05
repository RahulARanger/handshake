import sqlite3

import tortoise
from handshake.services.DBService.models import (
    ConfigBase,
    SessionBase,
    AssertBase,
    TestLogBase,
    TaskBase,
)
from handshake.services.DBService.models.enums import ConfigKeys
from handshake.services.DBService.migrator import migrate
from subprocess import run, PIPE


async def assertEntityNameType(connection, expected):
    info = await connection.execute_query("PRAGMA table_info('SessionBase');")

    found = False
    for row in info[1]:
        if row["name"] == "entityName":
            found = True
            assert row["type"] == expected
    assert found, "entityName not found"


class TestMigrationScripts:
    async def test_sqlite_version(self):
        assert int(sqlite3.sqlite_version_info[0]) >= 3
        assert int(sqlite3.sqlite_version_info[1]) >= 38

    async def test_default_config(self, root_dir):
        assert (root_dir / "config.json").exists()
        for required in (
            ConfigKeys.version,
            ConfigKeys.maxRunsPerProject,
            ConfigKeys.reset_test_run,
        ):
            assert ConfigBase.exists(key=required)

    async def test_bump_v5(
        self, sample_test_session, create_suite, get_vth_connection, scripts, db_path
    ):
        await get_vth_connection(scripts, 5)

        session = await sample_test_session
        test_run = await session.test

        # based on the previous test we are now in version: 5
        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 5

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

        assert migrate(None, db_path) == (
            True,
            True,
        ), "we still have further migration to go"

        assert (await TaskBase.filter(ticketID=suite.suiteID).first()).picked == 0
        # new column: processed, is added.
        assert (await TaskBase.filter(ticketID=suite.suiteID).first()).processed == 0

    async def test_bump_v6(
        self, get_vth_connection, scripts, db_path, sample_test_session
    ):
        await get_vth_connection(scripts, 6)
        assert migrate(None, db_path) == (
            False,
            True,
        ), "it should now be in the latest version"

        # relies on init_job to complete the migration
        record = await ConfigBase.filter(key=ConfigKeys.reset_test_run).first()
        assert record.value == "1"

        logs = await TestLogBase.all().values("dropped")
        assert len(logs) >= 0

    async def test_version_command(self, root_dir):
        result = run(f'handshake db-version "{root_dir}"', shell=True, stderr=PIPE)
        assert result.returncode == 0
        assert "Currently at: v7." in result.stderr.decode()

    async def test_migration_command(self, get_vth_connection, root_dir, scripts):
        await get_vth_connection(scripts, 3)
        result = run(f'handshake migrate "{root_dir}"', shell=True, stderr=PIPE)
        assert result.returncode == 0
        assert "Migrated to latest version!" in result.stderr.decode()
