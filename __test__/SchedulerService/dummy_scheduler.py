from apscheduler.schedulers.asyncio import AsyncIOScheduler


class DummyJob:
    name = "dummy-job"

    def remove(self):
        ...


class DummyScheduler(AsyncIOScheduler):
    def add_job(self, *_, **__):
        return DummyJob()

    def get_job(self, _, **__):
        return DummyJob()
