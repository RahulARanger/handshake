from src.services.DBService.models.task_base import TaskBase
from sanic import Sanic
from apscheduler.schedulers.asyncio import AsyncIOScheduler


async def drop_task(ticket_id: str):
    task = await TaskBase.filter(ticketID=ticket_id).first()
    if not task:
        return
    await task.delete()
    await task.save()


def ctx_scheduler() -> AsyncIOScheduler:
    return Sanic.get_app().ctx.scheduler
