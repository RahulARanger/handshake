from datetime import datetime
from typing import TypedDict, Optional, Union, List, Dict
from tortoise.models import Model
from tortoise import fields
from enum import StrEnum


class Status(StrEnum):
    PASSED = "PASSED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"
    PENDING = "PENDING"
    YET_TO_CALCULATE = "YET_TO_CALC"  # needs to be updated by our server to either passed or failed
    # yet_to_calc is mostly seen for the suite


class LogLevel(StrEnum):
    info = "info"
    warn = "warn"
    error = "error"
    trace = "trace"
    debug = "debug"
    silent = "silent"


class SuiteType(StrEnum):
    TEST = "TEST"
    SUITE = "SUITE"


class SessionBase(Model):
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
    suites = fields.ReverseRelation["SuiteBase"]
    standing = fields.CharEnumField(Status, description="status of the session", default="PENDING")
    framework = fields.CharField(max_length=35, null=False)
    specs = fields.JSONField()
    suitesConfig = fields.JSONField()
    logLevel = fields.CharEnumField(LogLevel, description="Log Level set for this session")
    automationProtocol = fields.CharField(max_length=20, description="https://webdriver.io/docs/automationProtocols/")


class SuiteBase(Model):
    # https://tortoise.github.io/models.html#the-db-backing-field
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
    retried = fields.IntField(default=0, null=False)
    tests = fields.IntField(default=0, null=False)
    passed = fields.IntField(default=0, null=False)
    failures = fields.IntField(default=0, null=False)
    skipped = fields.IntField(default=0, null=False)
    parent = fields.CharField(max_length=45, description="Parent Suite's ID", default="")
    duration = fields.FloatField(default=0, null=False)
    startDate = fields.DatetimeField()
    endDate = fields.DatetimeField(null=True)
    standing = fields.CharEnumField(Status, description="status of the suite", default="PENDING")
    tags = fields.CharField(max_length=225, description="Comma separated tags", default="", null=False)


class CommonCols(TypedDict):
    duration: float
    retried: int
    totalRetries: int
    failures: int
    tests: int
    skipped: int
    passed: int
    standing: Status

    startDate: Union[datetime, str]
    endDate: Optional[Union[datetime, str]]


class RegistersSession(CommonCols):
    sessionID: str
    suiteID: str
    browserName: str
    browserVersion: str
    platformName: str
    framework: str
    specs: List[str]
    suitesConfig: Dict[str, str]
    automationProtocol: str


class RegisterSuite(CommonCols):
    tags: str
    suiteType: SuiteType
    session_id: str
    suiteID: str
    title: str
    full_title: str


def understand_js_date(utc_date_string: str) -> datetime:
    return datetime.strptime(utc_date_string, "%a, %d %b %Y %H:%M:%S %Z")
