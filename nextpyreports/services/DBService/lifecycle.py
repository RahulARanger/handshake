from nextpyreports.services.DBService.models.config_base import ConfigBase, JobBase
from nextpyreports.services.DBService.models.result_base import RunBase
from nextpyreports.services.SchedularService.constants import JobType
from tortoise import Tortoise, connections
from nextpyreports.services.DBService.shared import db_path
from typing import Optional

models = ["nextpyreports.services.DBService.models"]


async def init_tortoise_orm(force_db_path: Optional[str] = None):
    await Tortoise.init(db_url=r"{}".format(f'sqlite://{force_db_path if force_db_path else db_path()}'), modules={
        "models": models
    })
    await Tortoise.generate_schemas()


async def create_run(projectName: str) -> str:
    await ConfigBase.update_or_create(configID=69)
    await create_or_update_jobs()

    return str((await RunBase.create(
        projectName=projectName
    )).testID)


async def create_or_update_jobs():
    await JobBase.update_or_create(
        jobID=JobType.LOOKUP_JOB,
        name="lookup-jobs",
        instances=2,
        interval=15
    )

    await JobBase.update_or_create(
        jobID=JobType.INIT_CONNECTION_JOBS,
        name="init-connections"
    )

    await JobBase.update_or_create(
        jobID=JobType.MODIFY_SUITE,
        name="modify-suite"
    )

    await JobBase.update_or_create(
        jobID=JobType.MODIFY_TEST_RUN,
        name="complete-test-run"
    )

    await JobBase.update_or_create(
        jobID=JobType.EXECUTOR,
        name='execute-scheduler'
    )


async def close_connection():
    await connections.close_all()
