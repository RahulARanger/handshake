from handshake.services.DBService.models.types import AttachmentType
from handshake.services.DBService.models.result_base import SuiteBase
from tortoise.models import Model
from tortoise.fields import (
    JSONField,
    CharEnumField,
    ForeignKeyField,
    ForeignKeyRelation,
    TextField,
    UUIDField,
)


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


class StaticBase(AttachmentFields):
    attachmentID = UUIDField(pk=True)
    entity: ForeignKeyRelation[SuiteBase] = ForeignKeyField(
        "models.SuiteBase", related_name="staticAttachments", to_field="suiteID"
    )
