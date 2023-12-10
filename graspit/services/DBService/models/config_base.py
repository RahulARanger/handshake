from tortoise.models import Model
from graspit.services.DBService.models.enums import ConfigKeys
from tortoise.fields import (
    IntField,
    CharEnumField,
    TextField,
    UUIDField,
)


class ConfigBase(Model):
    key = CharEnumField(
        ConfigKeys, pk=True, null=False, description="Type of job we would like to run"
    )
    value = TextField(null=False, description="Handling type is upto us")


class ExportBase(Model):
    ticketID = UUIDField(pk=True)
    maxTestRuns = IntField(
        null=True,
        default=10,
        description="Number of test runs to export [recent ones are picked]",
    )
