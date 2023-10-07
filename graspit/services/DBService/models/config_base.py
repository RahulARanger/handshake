from tortoise.models import Model
from graspit.services.SchedularService.constants import JobType
from graspit.services.DBService.models.enums import AttachmentType
from graspit.services.DBService.models.result_base import SuiteBase, RunBase
from tortoise.fields import (
    IntField,
    JSONField,
    CharEnumField,
    CharField,
    ForeignKeyField,
    ForeignKeyRelation,
    TextField,
    UUIDField,
    BooleanField,
)
from typing import TypedDict
from pydantic import BaseModel
from typing import Optional


class AttachmentFields(Model):
    attachmentValue = JSONField(
        description="An attachment value", default={"value": ""}
    )
    description = TextField(
        null=False, description="Description Field for the attachment"
    )
    type = CharEnumField(
        AttachmentType,
        description="Type of an attachment, refer the enums to get an idea",
    )

    class Meta:
        abstract = True


class AttachmentBase(AttachmentFields):
    table = "AttachmentBase"
    entity: ForeignKeyRelation[SuiteBase] = ForeignKeyField(
        "models.SuiteBase", related_name="attachment", to_field="suiteID"
    )


class TestConfigBase(AttachmentFields):
    table = "TableConfigBase"
    test: ForeignKeyRelation[RunBase] = ForeignKeyField(
        "models.RunBase", related_name="config", to_field="testID"
    )


class ValueForTestRunConfigBase(TypedDict):
    version: str
    maxTestRuns: int
    platformName: str


class PydanticModalForTestRunConfigBase(BaseModel):
    maxTestRuns: Optional[int]
    platformName: str


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
    key = CharField(description="Key", max_length=20)
    value = TextField(description="Handling type is upto us")

    # icon = TextField(description="base64 encoded of your icon")
    # maxTestRuns = IntField(
    #     null=True, default=10, description="Number of test runs to keep in our db"
    # )


class ExportBase(Model):
    ticketID = UUIDField(pk=True)
    test: ForeignKeyRelation[RunBase] = ForeignKeyField(
        "models.RunBase", related_name="config", to_field="testID"
    )
    maxTestRuns = IntField(
        null=True,
        default=10,
        description="Number of test runs to export [recent ones are picked]",
    )
    isDynamic = BooleanField(
        null=True, default=False, description="Export Dynamic pages only ?"
    )
