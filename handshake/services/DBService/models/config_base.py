from tortoise.models import Model
from handshake.services.DBService.models.enums import ConfigKeys
from tortoise.fields import IntField, CharEnumField, TextField, UUIDField, CharField


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
    clarity = CharField(
        max_length=30, description="Clarity code, empty if disabled", null=True
    )
