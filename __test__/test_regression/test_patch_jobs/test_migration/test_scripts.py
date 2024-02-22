import sqlite3

import tortoise
from handshake.services.DBService.models import (
    ConfigBase,
    SessionBase,
    AssertBase,
    ExportBase,
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
            ConfigKeys.maxRuns,
            ConfigKeys.reset_test_run,
        ):
            assert ConfigBase.exists(key=required)

    async def test_bump_v3(
        self, get_vth_connection, scripts, sample_test_run, create_session, db_path
    ):
        await get_vth_connection(scripts, 3)

        connection = tortoise.connections.get("default")
        test_run = await sample_test_run

        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 3

        for _ in range(3):
            await create_session(entityName="chrome", test_id=test_run.testID)

        script = scripts / "bump-v3.sql"
        assert script.exists()
        await assertEntityNameType(connection, "varchar(10)")

        assert migrate(None, db_path) == (
            True,
            True,
        ), "we still have further migration to go"

        await assertEntityNameType(connection, "varchar(30)")

        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 4

        entities = await SessionBase.all().values_list("entityName", flat=True)
        assert len(entities) == 3

        for entity in entities:
            assert entity == "chrome", "Data changed"

    async def test_bump_v4(
        self,
        get_vth_connection,
        scripts,
        sample_test_session,
        create_suite,
        create_tests,
        db_path,
        add_assertion,
    ):
        await get_vth_connection(scripts, 4)

        session = await sample_test_session
        # based on the previous test we are now in version; 4
        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 4

        script = scripts / "bump-v4.sql"
        assert script.exists()

        suite = await create_suite(session.sessionID)
        another_suite = await create_suite(
            session.sessionID, name="test", parent=suite.suiteID, is_test=True
        )

        title = "toExist"
        for _ in range(10):
            await add_assertion(another_suite.suiteID, title, True)
        for _ in range(10):
            await add_assertion(another_suite.suiteID, title, False)

        assert migrate(None, db_path) == (
            True,
            True,
        ), "we still have further migration to go"

        all_assertions_migrated = await AssertBase.filter(
            entity_id=another_suite.suiteID
        ).all()
        assert len(all_assertions_migrated) == 20

        assert (
            await AssertBase.filter(
                wait=1000,
                interval=500,
                entity_id=another_suite.suiteID,
                passed=False,
                title=title,
            ).count()
            == 10
        )
        assert (
            await AssertBase.filter(
                entity_id=another_suite.suiteID,
                wait=1000,
                interval=500,
                title=title,
                passed=True,
            ).count()
            == 10
        )
        generated = await AssertBase.all().values_list("id", flat=True)
        assert len(generated) == len(set(generated))

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
