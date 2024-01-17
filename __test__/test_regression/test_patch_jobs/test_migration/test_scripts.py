import sqlite3

import tortoise
from handshake.services.DBService.models import (
    ConfigBase,
    SessionBase,
    AttachmentBase,
    AssertBase,
    ExportBase,
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

        assert migrate(None, db_path) is True, "we still have further migration to go"

        await assertEntityNameType(connection, "varchar(30)")

        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 4

        entities = await SessionBase.all().values_list("entityName", flat=True)
        assert len(entities) == 3

        for entity in entities:
            assert entity == "chrome", "Data changed"

    async def test_bump_4(
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
        test = await create_suite(
            session.sessionID, name="test", parent=suite.suiteID, is_test=True
        )

        title = "toExist"
        for _ in range(10):
            await add_assertion(test.suiteID, title, True)
        for _ in range(10):
            await add_assertion(test.suiteID, title, False)

        assert not migrate(None, db_path), "it should now be in the latest version"

        all_assertions_migrated = await AssertBase.filter(entity_id=test.suiteID).all()
        assert len(all_assertions_migrated) == 20

        assert (
            await AssertBase.filter(
                wait=1000,
                interval=500,
                entity_id=test.suiteID,
                passed=False,
                title=title,
            ).count()
            == 10
        )
        assert (
            await AssertBase.filter(
                entity_id=test.suiteID,
                wait=1000,
                interval=500,
                title=title,
                passed=True,
            ).count()
            == 10
        )

        assert (
            await ExportBase.filter(clarity="").count() >= 0
        ), "This line would have failed if clarity column was not added."

        generated = await AssertBase.all().values_list("id", flat=True)
        assert len(generated) == len(set(generated))

    async def test_version_command(self, root_dir):
        result = run(f'handshake db-version "{root_dir}"', shell=True, stderr=PIPE)
        assert result.returncode == 0
        assert "Currently at: v5." in result.stderr.decode()
