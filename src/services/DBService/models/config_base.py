from tortoise.models import Model
from tortoise import fields


class ReportBase(Model):
    configID = fields.IntField(default=0, pk=True, description="There is one record possible in this table")
    maxTestRuns = fields.IntField(null=True, default=100, description="Max. Number of Test Runs to save")
    maxDailyReports = fields.IntField(null=True, default=10, description="Max. Number of Daily Reports to save")
    maxWeeklyReports = fields.IntField(null=True, default=10, description="Max. Number of Weekly Reports to save")
    maxBiWeeklyReports = fields.IntField(null=True, default=10, description="Max. Number of BiWeekly Reports to save")
    maxMonthlyReports = fields.IntField(null=True, default=10, description="Max. Number of Monthly Reports to save")
