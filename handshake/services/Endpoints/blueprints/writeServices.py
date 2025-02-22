import base64
from sanic.blueprints import Blueprint
from sanic.response import text, HTTPResponse
from sanic.log import logger
from sanic.request import Request
from handshake.services.DBService.models.types import (
    AddAttachmentForEntity,
)
from handshake.services.DBService.shared import root_dir
from handshake.services.DBService.models.static_base import (
    StaticBase,
)
from handshake.services.SchedularService.constants import writtenAttachmentFolderName
from handshake.services.Endpoints.define_api import definition

writeServices = Blueprint("WriteService", url_prefix="/write")


@writeServices.put("/addAttachmentForEntity", error_format="json")
@definition(
    summary="adds an image to the specified entity",
    description="saves an image and then attaches it to a specified entity",
    tag="add",
    deprecated=True,
    body={"application/json": AddAttachmentForEntity},
)
async def saveImage(request: Request) -> HTTPResponse:
    attachment = AddAttachmentForEntity.model_validate(request.json)

    record = await StaticBase.create(
        entity_id=attachment.entityID,
        description=attachment.description,
        type=attachment.type,
        title=attachment.title,
    )

    file_name = f"{record.attachmentID}.{record.type.lower()}"
    logger.debug("Received a file from user, saving it as {}", file_name)
    root = root_dir() / writtenAttachmentFolderName
    root.mkdir(exist_ok=True)
    test_root = root / str((await (await record.entity).session).test_id)
    test_root.mkdir(exist_ok=True)

    file = test_root / file_name
    file.write_bytes(base64.b64decode(attachment.value))
    record.value = file_name
    await record.save()
    return text(str(record.attachmentID), status=201)
