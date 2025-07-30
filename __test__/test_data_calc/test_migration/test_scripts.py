import json
import sqlite3
import tortoise
from handshake.services.DBService.models import (
    ConfigBase,
    TestLogBase,
    MigrationBase,
    SuiteBase,
    SessionBase,
    RunBase,
)
from .conftest import get_version
from handshake.services.DBService.models.enums import (
    ConfigKeys,
    MigrationStatus,
    MigrationTrigger,
    RunStatus,
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

    async def test_bump_v8(
        self, get_vth_connection, db_path, sample_test_session, create_suite
    ):
        await get_vth_connection(db_path, 8)
        suite = await create_suite(sample_test_session.sessionID, manual_insert=True)

        assert migration(
            db_path, do_once=True
        ), "it should now be in the latest version"
        await assert_migration(8, 9, MigrationStatus.PASSED, MigrationTrigger.AUTOMATIC)

        assert (await ConfigBase.filter(key=ConfigKeys.version).first()).value == "9"
        assert await RunBase.all().count() > 0
        status_before = set(await RunBase.all().values_list("status", flat=True)).pop()
        assert status_before == RunStatus.COMPLETED

        suite = await SuiteBase.filter(suiteID=suite[0]).first().values("started")
        assert suite["started"] is not None, "value should not change"

        # allowed now
        suite = await create_suite(
            sample_test_session.sessionID, started=None, manual_insert=True
        )
        assert suite[3] is None

        # we are also dropping table: "ExportBase" it was used long before v3

    async def test_bump_v9(
        self, get_vth_connection, db_path, sample_test_session, create_suite
    ):
        connection = await get_vth_connection(db_path, 9)
        suite = await create_suite(sample_test_session.sessionID, manual_insert=True)

        assert migration(
            db_path, do_once=True
        ), "it should now be in the latest version"
        await assert_migration(
            9, 10, MigrationStatus.PASSED, MigrationTrigger.AUTOMATIC
        )

        result = (
            await connection.execute_query(
                "SELECT setup_duration, teardown_duration from suitebase where suiteID = ?",
                (suite[0],),
            )
        )[1][0]
        assert result[0] == result[1] == 0

    async def test_bump_v10(
        self, get_vth_connection, db_path, sample_test_session, create_suite
    ):
        await get_vth_connection(db_path, 10)
        suite = await create_suite(sample_test_session.sessionID, manual_insert=True)

        assert migration(
            db_path, do_once=True
        ), "it should now be in the latest version"
        await assert_migration(
            10, 11, MigrationStatus.PASSED, MigrationTrigger.AUTOMATIC
        )

        suite = await SuiteBase.filter(suiteID=suite[0]).first()
        # one field is added, which is mention if the suite was retried later or not
        # default value is no
        assert not suite.retried_later

    async def test_bump_v11(
        self, get_vth_connection, scripts, db_path, sample_test_session
    ):
        await get_vth_connection(db_path, 11)

        await tortoise.connections.get("default").execute_query(
            'INSERT INTO "testlogbase" ("test_id","type","dropped","feed","title") VALUES (?,?,?,?,?)',
            [
                str(sample_test_session.test_id),
                "INFO",
                "2024-02-07 19:46:39.059284+00:00",
                "{}",
                "sample_log",
            ],
        )
        assert migration(
            db_path, do_once=True
        ), "it should now be in the latest version"
        await assert_migration(
            11, 12, MigrationStatus.PASSED, MigrationTrigger.AUTOMATIC
        )

        previous_log = await TestLogBase.filter(title="sample_log").first()
        assert previous_log.generatedBy == ""
        assert previous_log.generatedByGroup == 0
        assert previous_log.tags == []

    async def test_bump_v12(
        self,
        get_vth_connection,
        db_path,
        helper_to_create_test_and_session,
    ):
        connection = await get_vth_connection(db_path, 12)
        test_id, sample_session = await helper_to_create_test_and_session(
            manual_insert_test_run=True, connection=connection, return_id=True
        )
        await connection.execute_query(
            "update runbase set suiteSummary = ? where testID = ?",
            (json.dumps(dict(passed=2, failed=3, skipped=1, count=6)), test_id),
        )

        assert migration(
            db_path, do_once=True
        ), "it should now be in the latest version"
        await assert_migration(
            12, 13, MigrationStatus.PASSED, MigrationTrigger.AUTOMATIC
        )

        migrated_run = await RunBase.filter(testID=test_id).first()
        assert migrated_run.passedSuites == 2
        assert migrated_run.failedSuites == 3
        assert migrated_run.suites == 6
        assert migrated_run.skippedSuites == 1

    async def test_bump_v13(
        self,
        get_vth_connection,
        db_path,
        helper_to_create_test_and_session,
        create_suite,
    ):
        connection = await get_vth_connection(db_path, 13)
        test_id, sample_session = await helper_to_create_test_and_session(
            manual_insert_test_run=True, connection=connection, return_id=True
        )
        suite = await create_suite(sample_session, manual_insert=True)

        assert migration(
            db_path, do_once=True
        ), "it should now be in the latest version"
        await assert_migration(
            13, 14, MigrationStatus.PASSED, MigrationTrigger.AUTOMATIC
        )

        sample_session = await SessionBase.filter(sessionID=sample_session).first()
        suite = await SuiteBase.filter(suiteID=suite[0]).first()

        assert sample_session.xpassed == sample_session.xfailed == 0
        assert suite.xpassed == suite.xfailed == 0

        run_record = await RunBase.filter(testID=test_id).first()
        assert (
            run_record.xpassed
            == run_record.xfailed
            == run_record.xfailedSuites
            == run_record.xpassedSuites
        )


    async def test_bump_v14(
        self,
        get_vth_connection,
        db_path,
        helper_to_create_test_and_session,
    ):
        connection = await get_vth_connection(db_path, 14)
        test_id, sample_session = await helper_to_create_test_and_session(
            manual_insert_test_run=True, connection=connection, return_id=True
        )

        assert migration(
            db_path, do_once=True
        ), "it should now be in the latest version"
        await assert_migration(
            14, 15, MigrationStatus.PASSED, MigrationTrigger.AUTOMATIC
        )
        run_record = await RunBase.filter(testID=test_id).first()
        assert (
            run_record.projectDescription is None
        )

    async def test_bump_v15(
        self,
        get_vth_connection,
        scripts,
        db_path,
        helper_to_create_test_and_session,
        create_suite,
        attach_config
    ):
        connection = await get_vth_connection(db_path, 15)
        test_id, sample_session = await helper_to_create_test_and_session(
            manual_insert_test_run=True, connection=connection, return_id=True
        )
        await attach_config(test_id, tags=[dict(label="test", desc="desc")], manual=True)

        assert migration(
            db_path, do_once=True
        ), "it should now be in the latest version"
        await assert_migration(
            15, 16, MigrationStatus.PASSED, MigrationTrigger.AUTOMATIC
        )
        run_record = await RunBase.filter(testID=test_id).first()
        assert (
            run_record.tags[0]["label"] == 'test'
        )
        assert (
                run_record.tags[0]["desc"] == 'desc'
        )

    # say you are in v8 and have reverted your python build to an older version which uses v7
    # question: how does migrate function work?

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
        await get_vth_connection(db_path, DB_VERSION)
        assert (await get_version()) == str(DB_VERSION)
        revert_step_back(DB_VERSION, db_path)
        await assert_migration(DB_VERSION, DB_VERSION - 1, MigrationStatus.PASSED, MigrationTrigger.CLI)
        assert (await get_version()) == str(DB_VERSION - 1)
