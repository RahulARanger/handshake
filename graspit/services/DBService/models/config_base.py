from tortoise.models import Model
from graspit.services.SchedularService.constants import JobType
from graspit.services.DBService.models.enums import ConfigKeys
from tortoise.fields import (
    IntField,
    CharEnumField,
    CharField,
    TextField,
    UUIDField,
    BooleanField,
)


class JobBase(Model):
    table = "JobBase"
    jobID = CharEnumField(
        JobType, null=False, description="Type of job we would like to run"
    )
    interval = IntField(
        null=True,
        default=10,
        description="Interval configured for the job triggered in intervals (s)",
    )
    instances = IntField(
        null=True,
        default=1,
        description="Number of parallel instances to run jobs triggered in intervals",
    )
    name = CharField(max_length=30, description="Any name you wanted to use for a job")


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
