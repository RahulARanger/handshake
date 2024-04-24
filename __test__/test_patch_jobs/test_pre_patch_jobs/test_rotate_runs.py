from pytest import mark
from handshake.services.DBService.models import RunBase, ConfigBase
from handshake.services.SchedularService.start import Scheduler
from handshake.services.DBService.models.enums import ConfigKeys
from concurrent.futures.thread import ThreadPoolExecutor
from handshake.services.SchedularService.constants import (
    writtenAttachmentFolderName,
)
from shutil import rmtree


@mark.usefixtures("sample_test_session")
class TestRotateTestRuns:
    async def test_rotate_empty_runs(self, db_path):
        scheduler = Scheduler(db_path.parent)
        await scheduler.rotate_test_runs()

    async def test_no_limit_exceeded(
        self, db_path, helper_create_test_run, helper_set_db_config
    ):
        await helper_set_db_config(2)
        await helper_create_test_run("run1")
        await helper_create_test_run("run1")

        assert await RunBase.filter(projectName__icontains="run1").count() == 2
        scheduler = Scheduler(db_path.parent)
        await scheduler.rotate_test_runs()
        assert await RunBase.filter(projectName__icontains="run1").count() == 2

    async def test_limit_exceeded(
        self, db_path, helper_create_test_run, helper_set_db_config
    ):
        await helper_set_db_config(2)
        for _ in range(100):
            await helper_create_test_run("run1")

        assert await RunBase.filter(projectName__icontains="run1").count() == 100
        scheduler = Scheduler(db_path.parent)
        await scheduler.rotate_test_runs()
        assert await RunBase.filter(projectName__icontains="run1").count() == 2
        assert (
            int((await ConfigBase.filter(key=ConfigKeys.recentlyDeleted).first()).value)
            == 98
        )

    async def test_limit_exceeded_for_multiple_projects(
        self, db_path, helper_create_test_run, helper_set_db_config
    ):
        await helper_set_db_config(3)
        for _ in range(100):
            await helper_create_test_run("run1")
        for _ in range(100):
            await helper_create_test_run("run2")

        assert await RunBase.filter(projectName__icontains="run1").count() == 100
        assert await RunBase.filter(projectName__icontains="run2").count() == 100

        scheduler = Scheduler(db_path.parent)
        await scheduler.rotate_test_runs()

        assert await RunBase.filter(projectName__icontains="run1").count() == 3
        assert await RunBase.filter(projectName__icontains="run2").count() == 3

        assert (
            int((await ConfigBase.filter(key=ConfigKeys.recentlyDeleted).first()).value)
            == 97 + 97
        )

    async def test_delete_attachments(
        self, db_path, helper_create_test_run, helper_set_db_config
    ):
        await helper_set_db_config(1)  # it would be 2
        with_attachment = await helper_create_test_run("run1")
        with_another_attachment = await helper_create_test_run("run1")
        one_attachment = await helper_create_test_run("run1")
        await helper_create_test_run("run1")

        def save_file(index, test_id):
            collection = db_path.parent / writtenAttachmentFolderName / str(test_id)
            collection.mkdir(exist_ok=True)
            (collection / ("test1" + str(index))).write_text("sample-texts")

        with ThreadPoolExecutor(max_workers=3) as workers:
            for _ in range(5):
                workers.submit(save_file, _, with_attachment.testID)
            for _ in range(5):
                workers.submit(save_file, _, with_another_attachment.testID)
            for _ in range(1):
                workers.submit(save_file, _, one_attachment.testID)

        assert await RunBase.filter(projectName__icontains="run1").count() == 4

        def exists(test_id, yes=True):
            result = (
                db_path.parent / writtenAttachmentFolderName / str(test_id)
            ).exists()
            assert result if yes else not result

        exists(with_attachment.testID)
        exists(with_another_attachment.testID)
        exists(one_attachment.testID)

        scheduler = Scheduler(db_path.parent)
        await scheduler.rotate_test_runs()

        exists(with_attachment.testID, False)
        exists(with_another_attachment.testID, False)
        exists(one_attachment.testID)

        assert await RunBase.filter(projectName__icontains="run1").count() == 2

        rmtree(
            db_path.parent / writtenAttachmentFolderName / str(one_attachment.testID)
        )
