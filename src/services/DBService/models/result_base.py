from datetime import datetime
from tortoise.models import Model
from tortoise import fields
from src.services.DBService.models.enums import Status, LogLevel, SuiteType


class CommandReportFields(Model):
    started = fields.DatetimeField(descrption="Start Datetime field")
    ended = fields.DatetimeField(null=True, description="End Datetime field")
    tests = fields.IntField(default=0, null=False, description="No. of the test entries")
    passed = fields.IntField(default=0, null=False, description="Passed test entities")
    failures = fields.IntField(default=0, null=False, description="Failed test entities")
    skipped = fields.IntField(default=0, null=False, description='test entities that were skipped')
    duration = fields.FloatField(default=0, null=False, description="duration of test entity")
    retried = fields.IntField(default=0, null=False, description="number of the retries performed")
    standing = fields.CharEnumField(Status, description="status of the test run", default=Status.PENDING)
    suitesConfig = fields.JSONField(description='Dict. of suites', default={})

    class Meta:
        abstract = True


class CommonDetailedFields(CommandReportFields):
    specs = fields.JSONField(description="List of spec files", default=[])
    suitesConfig = fields.JSONField(description='Dict. of suites', default={})

    class Meta:
        abstract = True


class RunBase(CommonDetailedFields):
    testID = fields.UUIDField(pk=True)
    sessions = fields.ReverseRelation["SessionBase"]
    totalRetries = fields.IntField(default=0, null=False, descriptiopn="Max. number of retries needed to perform")
    started = fields.DatetimeField(null=False, auto_now=True)
    projectName = fields.CharField(max_length=30, null=False, description="Name of the project")
    collectionName = fields.CharField(max_length=30, null=False, description="Label for this project")
    instances = fields.IntField(default=1, description="Number of instances used")
    framework = fields.CharField(max_length=35, null=False, default="-")
    logLevel = fields.CharEnumField(
        LogLevel, null=True, description="Log Level set for this run",
        default=LogLevel.info)
    tags = fields.JSONField(description='list of all tags', default=[])


class SessionBase(CommonDetailedFields):
    test: fields.ForeignKeyRelation[RunBase] = fields.ForeignKeyField(
        "models.RunBase", related_name="runs", to_field="testID"
    )
    suites = fields.ReverseRelation["SuiteBase"]
    sessionID = fields.CharField(max_length=35, pk=True)
    browserName = fields.CharField(max_length=10, default="")
    browserVersion = fields.CharField(max_length=20, default="")
    platformName = fields.CharField(max_length=10, default="")


class SuiteBase(CommandReportFields):
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
    file = fields.CharField(max_length=150, null=False, description="path to the spec file")
    parent = fields.CharField(max_length=45, description="Parent Suite's ID", default="")
    tags = fields.JSONField(description='list of all tags', default=[])
    modified = fields.DatetimeField(auto_now=True, description='Modified timestamp', null=False)


class AttachmentBase:
    test: fields.ForeignKeyRelation[SuiteBase] = fields.ForeignKeyField(
        "models.SuiteBase", related_name="attachments", to_field="suiteID"
    )
    attachmentValue = fields.JSONField(description="An attachment value", default={"value": ""}, null=False)
    label = fields.TextField(max_length=30, null=False, description="Label for the attachment")


def understand_js_date(utc_date_string: str) -> datetime:
    return datetime.strptime(utc_date_string, "%a, %d %b %Y %H:%M:%S %Z")
