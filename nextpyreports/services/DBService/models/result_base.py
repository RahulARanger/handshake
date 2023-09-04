from tortoise.models import Model
from tortoise.fields import DatetimeField, IntField, FloatField, JSONField, CharEnumField, UUIDField, CharField, \
    ReverseRelation, ForeignKeyField, ForeignKeyRelation, TextField
from tortoise.contrib.pydantic import pydantic_model_creator
from nextpyreports.services.DBService.models.enums import Status, SuiteType, AttachmentType


class CommandReportFields(Model):
    started = DatetimeField(descrption="Start Datetime field")
    ended = DatetimeField(null=True, description="End Datetime field")
    tests = IntField(default=0, null=False, description="No. of the test entries")
    passed = IntField(default=0, null=False, description="Passed test entities")
    failed = IntField(default=0, null=False, description="Failed test entities")
    skipped = IntField(default=0, null=False, description='test entities that were skipped')
    duration = FloatField(default=0, null=False, description="duration of test entity")
    retried = IntField(default=0, null=False, description="number of the retries performed")
    standing = CharEnumField(Status, description="status of the test run", default=Status.PENDING)
    suitesConfig = JSONField(description='Dict. of suites', default={})

    class Meta:
        abstract = True


class CommonDetailedFields(CommandReportFields):
    suitesConfig = JSONField(description='Dict. of suites', default={})

    class Meta:
        abstract = True


class EntityBaseSpecific:
    error = JSONField(description="Error found", default={}, null=True)
    errors = JSONField(description="Errors found", default={}, null=True)

    class Meta:
        abstract = True


class RunBase(CommonDetailedFields):
    table = "RunBase"
    testID = UUIDField(pk=True)
    sessions = ReverseRelation["SessionBase"]
    tasks = ReverseRelation["TaskBase"]
    started = DatetimeField(null=False, auto_now=True)
    projectName = CharField(max_length=30, null=False, description="Name of the project")
    specStructure = JSONField(description="file structure of spec files", default=dict())
    suiteSummary = JSONField(description="summary of the suites", default=dict(count=0, passed=0, failed=0, skipped=0))


class SessionBase(CommonDetailedFields):
    table = "SessionBase"
    test: ForeignKeyRelation[RunBase] = ForeignKeyField(
        "models.RunBase", related_name="sessions", to_field="testID"
    )
    suites = ReverseRelation["SuiteBase"]
    sessionID = CharField(max_length=45, pk=True)
    browserName = CharField(max_length=10, default="")
    browserVersion = CharField(max_length=20, default="")
    platformName = CharField(max_length=10, default="")
    simplified = TextField(default="", description="browser name & version &/ platform name included")
    specs = JSONField(description="List of spec files", default=[])
    hooks = IntField(default=0, null=False, description="Number of hooks used")


class SuiteBase(CommandReportFields, EntityBaseSpecific):
    table = "SuiteBase"
    # https://tortoise.github.io/models.html#the-db-backing-field
    # so we require session_id instead of sessionID
    session: ForeignKeyRelation[SessionBase] = ForeignKeyField(
        "models.SessionBase", related_name="suites", to_field="sessionID"
    )
    suiteID = CharField(max_length=45, pk=True)
    suiteType = CharEnumField(
        SuiteType, description="Specifies whether if it is a test suite or test case", null=False
    )
    title = TextField(max_length=225)
    fullTitle = TextField(null=True, default="", max_length=225)
    file = TextField(max_length=150, null=False, description="path to the spec file")
    description = TextField(null=True, default="", description="Summary if provided for the test entity")
    parent = CharField(max_length=45, description="Parent Suite's ID", default="")
    tags = JSONField(description='list of all tags', default=[])
    modified = DatetimeField(auto_now=True, description='Modified timestamp', null=False)


class AttachmentFields(Model):
    test: ForeignKeyRelation[SuiteBase] = ForeignKeyField(
        "models.SuiteBase", related_name="attachments", to_field="suiteID"
    )
    attachmentValue = JSONField(description="An attachment value", default={"value": ""})
    type = CharEnumField(AttachmentType, description="Type of an attachment, refer the enums to get an idea")

    class Meta:
        abstract = True


class AttachmentBase(AttachmentFields):
    table = "AttachmentBase"
    description = JSONField(null=True, default={"text": None})


RunBasePydanticModel = pydantic_model_creator(RunBase)
SuiteBasePydanticModel = pydantic_model_creator(SuiteBase)
