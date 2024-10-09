from handshake.services.DBService.models.types import AttachmentType
from handshake.services.DBService.models.result_base import SuiteBase
from tortoise.models import Model
from tortoise.fields import (
    JSONField,
    CharEnumField,
    CharField,
    ForeignKeyField,
    ForeignKeyRelation,
    TextField,
    UUIDField,
)


class AttachmentFields(Model):
    extraValues = JSONField(
        description="Key to Value pair to understand more about the attachment",
        default={},
    )
    description = TextField(
        null=False, description="Description Field for the attachment"
    )
    value = TextField(description="Attachment Value", default="", null=False)
    title = CharField(
        null=False, max_length=300, description="Title field for the Attachment"
    )
    type = CharEnumField(
        AttachmentType,
        description="Type of an attachment, refer the enums to get an idea",
    )
    tags = JSONField(
        description="comma separated list of tags to label this attachment",
        default=[],
    )

    class Meta:
        abstract = True


class AttachmentBase(AttachmentFields):
    table = "AttachmentBase"
    entity: ForeignKeyRelation[SuiteBase] = ForeignKeyField(
        "models.SuiteBase", related_name="attachment", to_field="suiteID"
    )


class StaticBase(AttachmentFields):
    attachmentID = UUIDField(pk=True)
    entity: ForeignKeyRelation[SuiteBase] = ForeignKeyField(
        "models.SuiteBase", related_name="staticAttachments", to_field="suiteID"
    )
