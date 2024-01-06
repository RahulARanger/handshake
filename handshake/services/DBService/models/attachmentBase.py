from handshake.services.DBService.models.result_base import SuiteBase
from tortoise.models import Model
from tortoise.fields import (
    ForeignKeyField,
    ForeignKeyRelation,
    TextField,
    IntField,
    BooleanField,
)


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
