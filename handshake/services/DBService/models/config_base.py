from handshake.services.DBService.models.enums import ConfigKeys
from tortoise.fields import IntField
from handshake.services.DBService.models.result_base import RunBase
from tortoise.models import Model
from tortoise.fields import (
    CharEnumField,
    ForeignKeyField,
    ForeignKeyRelation,
    TextField,
    UUIDField,
    BooleanField,
    JSONField,
)


class ConfigBase(Model):
    key = CharEnumField(
        ConfigKeys, pk=True, null=False, description="Type of job we would like to run"
    )
    value = TextField(null=False, description="Handling type is up to us")


class ExportBase(Model):
    ticketID = UUIDField(pk=True)
    maxTestRuns = IntField(
        null=True,
        default=10,
        description="Number of test runs to export [recent ones are picked]",
    )


class TestConfigBase(Model):
    test: ForeignKeyRelation[RunBase] = ForeignKeyField(
        "models.RunBase", related_name="runs", to_field="testID"
    )
    platform = TextField(null=False, description="could be windows or linux")
    framework = TextField(null=False, description="name of the framework used")
    maxInstances = IntField(
        null=True, default=1, description="Max. Number of workers used to run the tests"
    )
    fileRetries = IntField(
        null=False,
        default=0,
        description="Number of times it can retry a spec file",
    )
    avoidParentSuitesInCount = BooleanField(
        null=False,
        default=False,
        description="whether to count the spec file as a suite or not,"
        " example: in gherkin if in a feature file with one scenario, "
        "if this value is true then the number of suites is treated as 1 else 2",
    )
    bail = IntField(
        null=False,
        default=0,
        description="if > 0 then it means that run would stop if it finds this number of test cases failed",
    )
    tags = JSONField(
        default=[],
        null=False,
        description="comma separated list of tags (used by framework) to filter the spec files",
    )
