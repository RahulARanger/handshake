import base64

from sanic.blueprints import Blueprint
from sanic.response import text, HTTPResponse
from loguru import logger
from sanic.request import Request
from handshake.services.DBService.models.types import (
    AddAttachmentForEntity,
)
from handshake.services.DBService.shared import root_dir
from handshake.services.DBService.models.static_base import StaticBase
from handshake.services.SchedularService.constants import writtenAttachmentFolderName

writeServices = Blueprint("WriteService", url_prefix="/write")


@writeServices.put("/addAttachmentForEntity")
async def saveImage(request: Request) -> HTTPResponse:
    attachment = AddAttachmentForEntity.model_validate(request.json)

    record = await StaticBase.create(
        entity_id=attachment.entityID,
        description=attachment.description,
        type=attachment.type,
    )

    file_name = f"{record.attachmentID}.{record.type.lower()}"
    logger.info("Received a file from user, saving it as {}", file_name)
    root = root_dir() / writtenAttachmentFolderName
    root.mkdir(exist_ok=True)
    test_root = root / str((await (await record.entity).session).test_id)
    test_root.mkdir(exist_ok=True)

    file = test_root / file_name
    file.write_bytes(base64.b64decode(attachment.value))

    await record.update_from_dict(
        dict(
            attachmentValue=dict(value=file_name, title=attachment.title),
        )
    )

    await record.save()
    return text(str(record.attachmentID), status=201)