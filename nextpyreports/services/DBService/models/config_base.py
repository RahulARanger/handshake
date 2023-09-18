from tortoise.models import Model
from nextpyreports.services.SchedularService.constants import JobType
from nextpyreports.services.DBService.models.enums import AttachmentType
from nextpyreports.services.DBService.models.result_base import SuiteBase, RunBase
from tortoise.fields import IntField, JSONField, CharEnumField, CharField, \
    ForeignKeyField, ForeignKeyRelation, TextField
from typing import TypedDict
from pydantic import BaseModel
from typing import Optional


class AttachmentFields(Model):
    attachmentValue = JSONField(description="An attachment value", default={"value": ""})
    description = TextField(null=False, description="Description Field for the attachment")
    type = CharEnumField(AttachmentType, description="Type of an attachment, refer the enums to get an idea")

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
    dynamic: bool
    version: str
    maxTestRuns: int
    platformName: str


class PydanticModalForTestRunConfigBase(BaseModel):
    dynamic: bool
    maxTestRuns: Optional[int]
    platformName: str


class JobBase(Model):
    table = "JobBase"
    jobID = CharEnumField(JobType, null=False, description="Type of job we would like to run")
    interval = IntField(null=True, default=10, description="Interval configured for the job triggered in intervals (s)")
    instances = IntField(
        null=True, default=1, description="Number of parallel instances to run jobs triggered in intervals")
    name = CharField(max_length=30, description="Any name you wanted to use for a job")
