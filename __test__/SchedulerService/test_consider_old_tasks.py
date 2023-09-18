from nextpyreports.services.DBService.models.dynamic_base import TaskBase
from nextpyreports.services.DBService.models.result_base import RunBase
from nextpyreports.services.SchedularService.center import init_jobs_connections
from pytest import mark
from __test__.SchedulerService.dummy_scheduler import DummyScheduler
from nextpyreports.services.SchedularService.constants import JobType


@mark.usefixtures("clean_close")
async def test_init_connections(db_path):
    test_run = await RunBase.create(projectName="test-init-connections")

    tasks = []
    for _id in range(200):
        tasks.append(
            await TaskBase.create(type=JobType.LOOKUP_JOB, test_id=test_run.testID, ticketID=f'{test_run.testID}-{_id}',
                                  picked=True))

    await init_jobs_connections(db_path, _scheduler=DummyScheduler())
    tasks = []
    for task in await TaskBase.all():
        tasks.append(task)
        assert not task.picked, "Old Tasks were not picked"

    for task in tasks:
        await task.delete()

    await test_run.delete()
