from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.services.SchedularService.updateRecords import modify_suite, fix_old_records, fix_old_records_id
from sanic import Sanic


def scheduler() -> AsyncIOScheduler:
    schedular = AsyncIOScheduler()
    return schedular


def ctx_scheduler() -> AsyncIOScheduler:
    return Sanic.get_app().ctx.scheduler


def schedule_update_suite(suite_id: str, suite_title: str):
    _scheduler = ctx_scheduler()
    _scheduler.add_job(
        fix_old_records, 'interval', seconds=10, name="fix old records", id=fix_old_records_id(),
        max_instances=1
    )
    return _scheduler.add_job(
        modify_suite, "date", args=[suite_id], name=f'update suite: {suite_title}', id=f'update-suite-${suite_id}'
    )  # run this immediately
