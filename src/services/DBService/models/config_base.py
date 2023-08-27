from tortoise.models import Model
from tortoise import fields


class ConfigBase(Model):
    table = "ConfigBase"
    configID = fields.IntField(default=69, pk=True)
    maxTestRuns = fields.IntField(null=True, default=100, description="Max. Number of Test Runs to save")
    dynamic = fields.BooleanField(default=False, description="Enable Dynamic Nature of report generation")
    # maxDailyReports = fields.IntField(null=True, default=10, description="Max. Number of Daily Reports to save")
    # maxWeeklyReports = fields.IntField(null=True, default=10, description="Max. Number of Weekly Reports to save")
    # maxBiWeeklyReports = fields.IntField(null=True, default=10, description="Max. Number of BiWeekly Reports to save")
    # maxMonthlyReports = fields.IntField(null=True, default=10, description="Max. Number of Monthly Reports to save")
