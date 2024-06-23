from subprocess import call
from pytest import mark
from tortoise.connection import connections
from handshake.services.DBService.models import (
    SuiteBase,
    SessionBase,
    RunBase,
    TestConfigBase,
    MigrationBase,
    TaskBase,
)


@mark.usefixtures("clean_close", "cleanup")
class TestMerger:
    async def test_normal_case(
        self,
        sample_test_session,
        create_session_with_hierarchy_with_no_retries,
        root_dir,
        root_dir_1,
        root_dir_2,
        helper_to_create_test_and_session,
        attach_config,
    ):
        first_connection = connections.get(root_dir_1.name)
        second_connection = connections.get(root_dir_2.name)

        # we would be merging the data in default connection and root_dir_1 connection and
        # save it in second_connection

        session = await sample_test_session
        session_2 = await helper_to_create_test_and_session(connection=first_connection)

        attach_config(
            session.test_id,
            connection=first_connection,
            file_retries=3,
            avoidParentSuitesInCount=True,
        )
        attach_config(session.test_id, connection=first_connection, file_retries=6)

        suites = await create_session_with_hierarchy_with_no_retries(
            session.test_id,
        )
        suites_2 = await create_session_with_hierarchy_with_no_retries(
            session_2.test_id, connection=first_connection
        )

        assert (
            call(
                f'handshake merge "{root_dir_2}" -m "{root_dir}" -m "{root_dir_1}"',
                shell=True,
            )
            == 0
        )

        for db in (
            SuiteBase,
            RunBase,
            SessionBase,
            TestConfigBase,
            MigrationBase,
            TaskBase,
        ):
            assert (await db.all().count()) + (
                await db.all(using_db=first_connection).count()
            ) == await db.all(using_db=second_connection).count(), repr(db)

        # Verifying the merging of the suitebase

        # patching the merged db
        assert (
            call(
                f'handshake patch "{root_dir_2}"',
                shell=True,
            )
            == 0
        )
