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
    RollupBase,
    StaticBase,
    AttachmentBase,
    AssertBase,
)
from handshake.services.DBService.models.enums import Status
from handshake.services.SchedularService.register import register_patch_test_run


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

        await attach_config(session.test_id, file_retries=3)
        await attach_config(
            session_2.test_id, connection=first_connection, file_retries=6
        )

        first_sessions = await create_session_with_hierarchy_with_no_retries(
            session.test_id,
        )
        second_sessions = await create_session_with_hierarchy_with_no_retries(
            session_2.test_id, connection=first_connection
        )

        await register_patch_test_run(testID=session.test_id)
        await register_patch_test_run(
            testID=session_2.test_id, connection=first_connection
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
            RollupBase,
            StaticBase,
            AttachmentBase,
            AssertBase,
        ):
            merge_1_count = await db.all().count()
            merge_2_count = await db.all(using_db=first_connection).count()
            total = await db.all(using_db=second_connection).count()
            assert total == (merge_2_count + merge_1_count), repr(db)

        # patching the merged db
        assert (
            call(
                f'handshake patch "{root_dir_2}"',
                shell=True,
            )
            == 0
        )

        # patch test-run job
        for session_record in (session, session_2):
            test = session_record.test_id
            test_record = (
                await RunBase.all(using_db=second_connection)
                .filter(testID=test)
                .first()
            )
            assert test_record.standing == Status.FAILED
            assert test_record.passed == 9
            assert test_record.failed == 9
            assert test_record.skipped == 9
            assert test_record.tests == 9 * 3

            assert test_record.suiteSummary["passed"] == 0
            assert test_record.suiteSummary["failed"] == 3
            assert test_record.suiteSummary["skipped"] == 0
            assert test_record.suiteSummary["count"] == 3

            assert test_record.ended
            assert (
                test_record.duration
                == (test_record.ended - test_record.started).total_seconds() * 1000
            )

        # patch test-suite
        for suite in (
            *await SuiteBase.filter(session_id__in=first_sessions).values_list(
                "suiteID", flat=True
            ),
            *await SuiteBase.filter(session_id__in=second_sessions).values_list(
                "suiteID", flat=True
            ),
        ):
            suite_record = (
                await SuiteBase.all(using_db=second_connection)
                .filter(suiteID=suite)
                .first()
            )

            assert (
                suite_record.passed == suite_record.failed == suite_record.skipped == 3
            )
            assert suite_record.tests == 9
            assert suite_record.standing == Status.FAILED
            assert suite_record.ended

            child_rollup_suite = await RollupBase.filter(suite_id=suite).first()
            assert (
                child_rollup_suite.passed
                == child_rollup_suite.failed
                == child_rollup_suite.skipped
                == 3
            )

            assert child_rollup_suite.tests == 9

    async def test_skipped_tables_to_merge(
        self,
        sample_test_session,
        create_session_with_hierarchy_with_no_retries,
        root_dir,
        root_dir_1,
        helper_to_create_test_and_session,
        attach_config,
    ):
        first_connection = connections.get(root_dir_1.name)

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

        await register_patch_test_run(testID=session.test_id)
        await register_patch_test_run(
            testID=session_2.test_id, connection=first_connection
        )

        assert (
            call(
                f'handshake merge "{root_dir_2}" -m "{root_dir}" -m "{root_dir_1}"',
                shell=True,
            )
            == 0
        )
