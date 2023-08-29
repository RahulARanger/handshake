import time
from multiprocessing import Process
from pytest import mark, fixture
from src.services.SchedularService.center import init_scheduler, close_connection, run_service
from apscheduler.schedulers.asyncio import AsyncIOScheduler


@fixture
async def scheduler(db_path):
    print(db_path)
    assert db_path.exists()
    _scheduler = await init_scheduler(db_path)
    return _scheduler


@mark.usefixtures("db_path", "scheduler")
class TestInitScheduler:
    async def test_init(self, scheduler: AsyncIOScheduler):
        assert scheduler.state == 1  # Running state

    async def test_shutdown(self, scheduler: AsyncIOScheduler):
        assert scheduler.state == 1
        scheduler.shutdown(wait=True)
        assert scheduler.state == 1  # not just scheduler
        await close_connection()  # close even the db connection
        assert scheduler.state == 0


def process_scheduler(db_path: str):
    return run_service(db_path)


@mark.usefixtures("db_path", "scheduler")
def test_signal_handling_sigterm(db_path):
    process = Process(target=run_service, args=(db_path,))
    process.start()
    time.sleep(.69)
    process.kill()
    assert process.is_alive() == True
