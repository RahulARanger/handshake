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
    ConfigBase,
)
from handshake.services.DBService.models.enums import Status, SuiteType, ConfigKeys
from handshake.services.SchedularService.register import register_patch_test_run
from handshake.services.DBService.lifecycle import writtenAttachmentFolderName, db_path
from handshake.services.DBService import DB_VERSION


async def helper_test_patch_test_run(session_record: SessionBase, connection=None):
    test = session_record.test_id
    test_record = await RunBase.all(using_db=connection).filter(testID=test).first()
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


async def helper_test_patch_suite(suite: SuiteBase, connection=None):
    suite_record = (
        await SuiteBase.all(using_db=connection).filter(suiteID=suite).first()
    )

    assert suite_record.passed == suite_record.failed == suite_record.skipped == 3
    assert suite_record.tests == 9
    assert suite_record.standing == Status.FAILED
    assert suite_record.ended

    child_rollup_suite = (
        await RollupBase.all(using_db=connection).filter(suite_id=suite).first()
    )
    assert (
        child_rollup_suite.passed
        == child_rollup_suite.failed
        == child_rollup_suite.skipped
        == 3
    )

    assert child_rollup_suite.tests == 9


async def add_attachments(connection, create_static_attachment, root_dir, check_in_dir):
    note = (
        await SuiteBase.all(using_db=connection)
        .filter(suiteType=SuiteType.SUITE)
        .limit(2)
        .all()
    )
    assert note
    moved_attachments = []
    for suite in note:
        for _ in range(2):
            test = (
                await SuiteBase.all(using_db=connection)
                .filter(suiteType=SuiteType.TEST, parent=suite.suiteID)
                .first()
            )
            attachment = await create_static_attachment(
                root_dir,
                test.suiteID,
                test.parent,
                connection=connection,
            )
            moved_attachments.append(
                check_in_dir
                / writtenAttachmentFolderName
                / test.parent
                / attachment.value
            )
            assert not moved_attachments[-1].exists()
    return moved_attachments


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
        create_static_attachment,
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

        note = (
            await SuiteBase.all(using_db=first_connection)
            .filter(suiteType=SuiteType.SUITE)
            .limit(2)
            .all()
        )
        assert note
        moved_attachments = await add_attachments(
            first_connection, create_static_attachment, root_dir_1, root_dir_2
        )
        from_second_ones = await add_attachments(
            None, create_static_attachment, root_dir, root_dir_2
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

        # checking if the attachments were moved
        for attachment in moved_attachments + from_second_ones:
            assert attachment.exists()
            assert await StaticBase.exists(
                attachmentID=attachment.stem, using_db=second_connection
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
        await helper_test_patch_test_run(session, second_connection)
        await helper_test_patch_test_run(session_2, second_connection)

        # patch test-suite

        for suite in (
            *await SuiteBase.filter(
                session_id__in=first_sessions, suiteType=SuiteType.SUITE
            ).values_list("suiteID", flat=True),
            *await SuiteBase.all(using_db=first_connection)
            .filter(session_id__in=second_sessions, suiteType=SuiteType.SUITE)
            .values_list("suiteID", flat=True),
        ):
            await helper_test_patch_suite(suite, second_connection)

    async def test_merge_patched_dbs(
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
                f'handshake patch "{root_dir}"',
                shell=True,
            )
            == 0
        )

        assert (
            call(
                f'handshake patch "{root_dir_1}"',
                shell=True,
            )
            == 0
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

        # patch test-run job
        await helper_test_patch_test_run(session, second_connection)
        await helper_test_patch_test_run(session_2, second_connection)

        # patch test-suite

        for suite in (
            *await SuiteBase.filter(
                session_id__in=first_sessions, suiteType=SuiteType.SUITE
            ).values_list("suiteID", flat=True),
            *await SuiteBase.all(using_db=first_connection)
            .filter(session_id__in=second_sessions, suiteType=SuiteType.SUITE)
            .values_list("suiteID", flat=True),
        ):
            await helper_test_patch_suite(suite, second_connection)

    async def test_merge_zipped_results(
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
                f'handshake zip-results "{root_dir}"',
                shell=True,
            )
            == 0
        )

        assert (
            call(
                f'handshake zip-results "{root_dir_1}"',
                shell=True,
            )
            == 0
        )

        assert (
            call(
                f'handshake merge "{root_dir_2}" -m "{root_dir.name}.tar.bz2" -m "{root_dir_1.name}.tar.bz2"',
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
        await helper_test_patch_test_run(session, second_connection)
        await helper_test_patch_test_run(session_2, second_connection)

        # patch test-suite

        for suite in (
            *await SuiteBase.filter(
                session_id__in=first_sessions, suiteType=SuiteType.SUITE
            ).values_list("suiteID", flat=True),
            *await SuiteBase.all(using_db=first_connection)
            .filter(session_id__in=second_sessions, suiteType=SuiteType.SUITE)
            .values_list("suiteID", flat=True),
        ):
            await helper_test_patch_suite(suite, second_connection)

    async def test_extra_tables_merge(
        self,
        sample_test_session,
        create_session_with_hierarchy_with_no_retries,
        root_dir_1,
        root_dir_2,
        helper_to_create_test_and_session,
        attach_config,
        add_assertion,
        get_vth_connection,
    ):
        first_connection = connections.get(root_dir_1.name)
        second_connection = connections.get(root_dir_2.name)
        first_connection = await get_vth_connection(
            db_path(root_dir_1), v=DB_VERSION - 1, connection=first_connection
        )

        # we would be merging the data in default connection and root_dir_1 connection and
        # save it in second_connection

        session_1 = await helper_to_create_test_and_session(
            manual_insert_test_run=True, connection=first_connection
        )
        await create_session_with_hierarchy_with_no_retries(
            session_1.test_id,
            connection=first_connection,
            skip_register=True,
            manual_insert=True,
        )
        any_test = (
            await SuiteBase.all(using_db=first_connection)
            .filter(suiteType=SuiteType.TEST)
            .first()
            .values("suiteID")
        )
        await add_assertion(
            any_test["suiteID"], "sample-assertion-1", True, connection=first_connection
        )
        await add_assertion(
            any_test["suiteID"],
            "sample-assertion-2",
            False,
            connection=first_connection,
        )

        to_change = (
            await ConfigBase.all(using_db=first_connection)
            .filter(key=ConfigKeys.maxRunsPerProject)
            .first()
        )
        to_change.value = 20
        await to_change.save()

        assert (
            call(
                f'handshake merge "{root_dir_2}" -m "{root_dir_1}"',
                shell=True,
            )
            == 0
        )
        assert (
            await ConfigBase.all(using_db=second_connection)
            .filter(key=ConfigKeys.version)
            .first()
        ).value == str(DB_VERSION)
        assert (
            await ConfigBase.all(using_db=second_connection)
            .filter(key=ConfigKeys.maxRunsPerProject)
            .first()
        ).value != "20"

        assert (await MigrationBase.all(using_db=second_connection).count()) == 2
        assert (await AssertBase.all(using_db=second_connection).count()) == 2
