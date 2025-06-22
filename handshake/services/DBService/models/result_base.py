from tortoise.models import Model
from tortoise.fields import (
    DatetimeField,
    IntField,
    FloatField,
    JSONField,
    CharEnumField,
    UUIDField,
    CharField,
    ReverseRelation,
    ForeignKeyField,
    BooleanField,
    ForeignKeyRelation,
    TextField,
)
from handshake.services.DBService.models.enums import (
    Status,
    SuiteType,
    RunStatus,
)


class CommandReportFields(Model):
    tests = IntField(
        default=0,
        null=False,
        description="No. of the test entries (either rolled up or direct)",
    )
    passed = IntField(
        default=0,
        null=False,
        description="Passed test entities (either rolled up or direct)",
    )
    failed = IntField(
        default=0,
        null=False,
        description="Failed test entities (either rolled up or direct)",
    )
    skipped = IntField(
        default=0,
        null=False,
        description="test entities that were skipped (either rolled up or direct)",
    )
    xfailed = IntField(
        default=0,
        null=False,
        description="test entities that were supposed to fail and has failed (either rolled up or direct)",
    )
    xpassed = IntField(
        default=0,
        null=False,
        description="test entities that were supposed to fail but has passed (either rolled up or direct)",
    )

    class Meta:
        abstract = True


class CommonDetailedFields(CommandReportFields):
    started = DatetimeField(descrption="Start Datetime field of test entity/session")
    ended = DatetimeField(
        null=True, description="End Datetime field of test entity/session"
    )
    duration = FloatField(
        default=0, null=False, description="duration of test entity/session"
    )

    class Meta:
        abstract = True


class EntityBaseSpecific:
    standing = CharEnumField(
        Status,
        description="observed status of the test run based on the test cases executed",
        default=Status.PENDING,
    )
    retried = IntField(
        default=0, null=False, description="number of the retries performed"
    )

    class Meta:
        abstract = True


class RunBase(CommonDetailedFields, EntityBaseSpecific):
    table = "RunBase"
    testID = UUIDField(pk=True)
    sessions = ReverseRelation["SessionBase"]
    tasks = ReverseRelation["TaskBase"]
    config = ReverseRelation["TestConfigBase"]
    started = DatetimeField(null=False, auto_now_add=True)
    projectName = CharField(
        max_length=30, null=False, description="Name of the project"
    )
    projectDescription = TextField(
        null=True, default="", description="Summary if provided for the test entity"
    )
    specStructure = JSONField(
        description="file structure of spec files", default=dict()
    )
    passedSuites = IntField(default=0, null=False, description="Passed suites")
    failedSuites = IntField(default=0, null=False, description="failed suites")
    skippedSuites = IntField(default=0, null=False, description="skipped suites")
    xpassedSuites = IntField(
        default=0, null=False, description="Was expected to failed but Passed suites"
    )
    xfailedSuites = IntField(
        default=0, null=False, description="Was expected to fail and was failed suites"
    )
    suites = IntField(default=0, null=False, description="total test suites")

    exitCode = IntField(
        null=False, default=0, description="Exit code for the test execution"
    )
    status = CharEnumField(
        RunStatus,
        description="status of the test run marked by the test framework",
        default=RunStatus.PENDING,
    )


class SessionBase(CommonDetailedFields):
    table = "SessionBase"
    test: ForeignKeyRelation[RunBase] = ForeignKeyField(
        "models.RunBase", related_name="sessions", to_field="testID"
    )
    suites = ReverseRelation["SuiteBase"]
    sessionID = UUIDField(pk=True)
    entityName = CharField(max_length=30, default="")
    entityVersion = CharField(max_length=20, default="")
    simplified = TextField(
        default="", description="browser name & version &/ platform name included"
    )
    hooks = IntField(default=0, null=False, description="Number of hooks used")


class SuiteBase(EntityBaseSpecific, CommonDetailedFields):
    table = "SuiteBase"
    # https://tortoise.github.io/models.html#the-db-backing-field
    # so we require session_id instead of sessionID
    session: ForeignKeyRelation[SessionBase] = ForeignKeyField(
        "models.SessionBase", related_name="suites", to_field="sessionID"
    )
    started = DatetimeField(description="Start time of the test entity", null=True)
    attachments = ReverseRelation["AttachmentBase"]
    retries = ReverseRelation["RetriedBase"]
    rolled_up = ReverseRelation["RollupBase"]

    suiteID = UUIDField(pk=True)
    suiteType = CharEnumField(
        SuiteType,
        description="Specifies whether if it is a test suite or test case",
        null=False,
    )
    title = TextField(max_length=225)
    file = TextField(max_length=150, null=False, description="path to the spec file")
    description = TextField(
        null=True, default="", description="Summary if provided for the test entity"
    )
    parent = CharField(max_length=45, description="Parent Suite's ID", default="")
    tags = JSONField(
        description="comma separated list of tags used by the framework to filter the suites or spec files",
        default=[],
    )
    modified = DatetimeField(
        auto_now=True, description="Modified timestamp", null=False
    )
    errors = JSONField(description="Errors found", default=[], null=True)
    setup_duration = FloatField(
        default=0, null=False, description="duration of test entity's setup process"
    )
    teardown_duration = FloatField(
        default=0, null=False, description="duration of test entity's teardown process"
    )
    retried_later = BooleanField(
        default=False,
        required=False,
        description="was this test entity retried later",
    )


class RollupBase(CommandReportFields):
    suite: ForeignKeyRelation[SuiteBase] = ForeignKeyField(
        "models.SuiteBase", related_name="rollup", to_field="suiteID"
    )


class RetriedBase(Model):
    tests = JSONField(
        default=[],
        description="details of all suites which were retried for a particular test case",
    )
    suite: ForeignKeyRelation[SuiteBase] = ForeignKeyField(
        "models.SuiteBase", related_name="retries", to_field="suiteID"
    )

    length = IntField(
        description="Just the length of the tests cols", default=1, null=False
    )

    modified = DatetimeField(
        auto_now=True, description="Modified timestamp", null=False
    )
