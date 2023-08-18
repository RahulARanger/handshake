from tortoise.models import Model
from tortoise import fields
from src.services.DBService.models.types import Status


class ConfigBase(Model):
    testID = fields.UUIDField(pk=True)
    sessions = fields.ReverseRelation["SessionBase"]
    started = fields.DatetimeField(null=False, auto_now=True)
    ended = fields.DatetimeField(null=True)
    projectName = fields.CharField(max_length=30, null=False, description="Name of the project")
    collectionName = fields.CharField(max_length=30, null=False, description="Label for this project")
    standing = fields.CharEnumField(Status, description="status of the test run", default=Status.PENDING)
    instances = fields.IntField(default=1, description="Number of instances used")


class ReportBase(Model):
    configID = fields.IntField(default=0, pk=True, description="There is one record possible in this table")
    maxTestRuns = fields.IntField(null=True, default=100, description="Max. Number of Test Runs to save")
    maxDailyReports = fields.IntField(null=True, default=10, description="Max. Number of Daily Reports to save")
    maxWeeklyReports = fields.IntField(null=True, default=10, description="Max. Number of Weekly Reports to save")
    maxBiWeeklyReports = fields.IntField(null=True, default=10, description="Max. Number of BiWeekly Reports to save")
    maxMonthlyReports = fields.IntField(null=True, default=10, description="Max. Number of Monthly Reports to save")