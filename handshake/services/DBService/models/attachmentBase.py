from handshake.services.DBService.models.result_base import SuiteBase
from tortoise.models import Model
from tortoise.fields import (
    ForeignKeyField,
    ForeignKeyRelation,
    TextField,
    IntField,
    DatetimeField,
    BooleanField,
    CharEnumField,
    CharField,
)
from handshake.services.DBService.models.enums import LogType, LogDisplayType


class AssertBase(Model):
    entity: ForeignKeyRelation[SuiteBase] = ForeignKeyField(
        "models.SuiteBase", related_name="assertion", to_field="suiteID"
    )
    passed = BooleanField(
        default=False, description="Whether the assertion passed or not"
    )
    wait = IntField(
        description="Number of milli-seconds configured to wait for this test",
        default=-1,
        null=True,
    )
    interval = IntField(
        description="interval (in milli-seconds) to test this assertion until it passes",
        default=-1,
        null=True,
    )
    title = TextField(description="Name of the Assertion")
    message = TextField(description="Message attached to the assertion")


class EntityLogBase(Model):
    entity: ForeignKeyRelation[SuiteBase] = ForeignKeyField(
        "models.SuiteBase", related_name="entityLog", to_field="suiteID"
    )
    message = TextField(description="formatted log message")
    type = CharEnumField(LogType, description="Log type", null=False)
    dropped = DatetimeField(auto_now=True, description="timestamp", null=False)
    label = CharField(
        max_length=12,
        description="label for this log (optional)",
        default="",
        null=True,
    )
    displayType = CharEnumField(
        LogDisplayType,
        description="Display type for log",
        null=True,
        default=LogDisplayType.TOGETHER,
    )
