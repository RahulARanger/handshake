from tortoise.models import Model
from tortoise.fields import IntField, BooleanField, CharField, CharEnumField
from src.services.SchedularService.constants import JobType


class ConfigBase(Model):
    table = "ConfigBase"
    configID = IntField(default=69, pk=True)
    maxTestRuns = IntField(null=True, default=100, description="Max. Number of Test Runs to save")
    dynamic = BooleanField(default=False, description="Enable Dynamic Nature of report generation")
    version = CharField(default="1.0.0", null=True, description="Version of this db file", max_length=10)
    lookupFreq = IntField(default=10, null=True)
    # maxDailyReports = fields.IntField(null=True, default=10, description="Max. Number of Daily Reports to save")
    # maxWeeklyReports = fields.IntField(null=True, default=10, description="Max. Number of Weekly Reports to save")
    # maxBiWeeklyReports = fields.IntField(null=True, default=10, description="Max. Number of BiWeekly Reports to save")
    # maxMonthlyReports = fields.IntField(null=True, default=10, description="Max. Number of Monthly Reports to save")


class JobBase(Model):
    table = "JobBase"
    jobID = CharEnumField(JobType, null=False, description="Type of job we would like to run")
    interval = IntField(null=True, default=15, description="Interval configured for the job triggered in intervals (s)")
    instances = IntField(
        null=True, default=1, description="Number of parallel instances to run jobs triggered in intervals")
    name = CharField(max_length=30, description="Any name you wanted to use for a job")


async def get_config() -> ConfigBase:
    return await ConfigBase.filter(configID=69).first()
