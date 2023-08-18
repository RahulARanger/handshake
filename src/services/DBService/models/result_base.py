from datetime import datetime
from tortoise.models import Model
from tortoise import fields
from src.services.DBService.models.enums import Status, LogLevel, SuiteType
from src.services.DBService.models.config_base import ConfigBase


class SessionBase(Model):
    test: fields.ForeignKeyRelation[ConfigBase] = fields.ForeignKeyField(
        "models.ConfigBase", related_name="tests", to_field="testID"
    )
    suites = fields.ReverseRelation["SuiteBase"]
    sessionID = fields.CharField(max_length=35, pk=True)
    duration = fields.FloatField(default=0, null=False)
    totalRetries = fields.IntField(default=0, null=False)
    retried = fields.IntField(default=0, null=False)
    tests = fields.IntField(default=0, null=False)
    passed = fields.IntField(default=0, null=False)
    failures = fields.IntField(default=0, null=False)
    skipped = fields.IntField(default=0, null=False)
    browserName = fields.CharField(max_length=10, default="")
    browserVersion = fields.CharField(max_length=20, default="")
    platformName = fields.CharField(max_length=10, default="")
    startDate = fields.DatetimeField()
    endDate = fields.DatetimeField(null=True)
    standing = fields.CharEnumField(Status, description="status of the session", default=Status.PENDING)
    framework = fields.CharField(max_length=35, null=False, default="-")
    specs = fields.JSONField()
    suitesConfig = fields.JSONField()
    logLevel = fields.CharEnumField(LogLevel, description="Log Level set for this session", default=LogLevel.info)
    automationProtocol = fields.CharField(
        max_length=20, description="https://webdriver.io/docs/automationProtocols/",
        default="")


class SuiteBase(Model):
    # https://tortoise.github.io/models.html#the-db-backing-field
    # so we require session_id instead of sessionID
    session: fields.ForeignKeyRelation[SessionBase] = fields.ForeignKeyField(
        "models.SessionBase", related_name="suites", to_field="sessionID"
    )
    suiteID = fields.CharField(max_length=45, pk=True)
    suiteType = fields.CharEnumField(
        SuiteType, description="Specifies whether if it is a test suite or test case", null=False
    )
    title = fields.TextField(max_length=225)
    fullTitle = fields.TextField(max_length=225)
    totalRetries = fields.IntField(default=0, null=False)
    file = fields.CharField(max_length=150, null=False, description="path to the spec file")
    retried = fields.IntField(default=0, null=False)
    tests = fields.IntField(default=0, null=False)
    passed = fields.IntField(default=0, null=False)
    failures = fields.IntField(default=0, null=False)
    skipped = fields.IntField(default=0, null=False)
    parent = fields.CharField(max_length=45, description="Parent Suite's ID", default="")
    duration = fields.FloatField(default=0, null=False)
    startDate = fields.DatetimeField()
    endDate = fields.DatetimeField(null=True)
    standing = fields.CharEnumField(Status, description="status of the suite", default=Status.PENDING)
    tags = fields.CharField(max_length=225, description="Comma separated tags", default="", null=False)
    modified = fields.DatetimeField(auto_now=True, description='Modified timestamp', null=False)


def understand_js_date(utc_date_string: str) -> datetime:
    return datetime.strptime(utc_date_string, "%a, %d %b %Y %H:%M:%S %Z")
