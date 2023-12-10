import sqlite3

import tortoise
from subprocess import run
from graspit.services.DBService.models import ConfigBase, SessionBase
from graspit.services.DBService.models.enums import ConfigKeys
from graspit.services.DBService.migrator import migration


async def assertEntityNameType(connection, expected):
    info = await connection.execute_query("PRAGMA table_info('SessionBase');")

    found = False
    for row in info[1]:
        if row["name"] == "entityName":
            found = True
            assert row["type"] == expected
    assert found, "entityName not found"


class TestMigration:
    async def test_bump_4(
        self, get_v3_connection, scripts, sample_test_run, create_session, db_path
    ):
        connection = tortoise.connections.get("default")
        test_run = await sample_test_run

        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 3

        for _ in range(3):
            await create_session(entityName="chrome", test_id=test_run.testID)

        script = scripts / "bump-v3.sql"
        assert script.exists()
        await assertEntityNameType(connection, "varchar(10)")

        assert not migration(db_path), "Migration failed"

        await assertEntityNameType(connection, "varchar(30)")

        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 4

        entities = await SessionBase.all().values_list("entityName", flat=True)
        assert len(entities) == 3

        for entity in entities:
            assert entity == "chrome", "Data changed"

    async def test_direct(self, root_dir, get_v3_connection):
        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 3

        result = run(f'graspit db migrate "{root_dir}"', cwd=root_dir)
        assert result.returncode == 0

        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 4
