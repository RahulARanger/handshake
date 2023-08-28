from src.services.DBService.models.task_base import TaskBase
from src.services.SchedularService.constants import JobType
from src.services.SchedularService.handlePending import lookup_for_tasks
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sanic import Sanic


def scheduler() -> AsyncIOScheduler:
    schedular = AsyncIOScheduler()
    schedular.add_job(
        lookup_for_tasks, "interval", seconds=3,
        id=JobType.LOOKUP_JOB, name='lookup for tasks'
    )
    return schedular


def ctx_scheduler() -> AsyncIOScheduler:
    return Sanic.get_app().ctx.scheduler


def drop_task(taskID: str):
    await TaskBase.filter(taskID=taskID).delete()
