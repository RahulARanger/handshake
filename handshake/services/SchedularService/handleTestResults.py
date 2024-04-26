from loguru import logger
from shutil import rmtree, copytree
from uuid import UUID
import json
import pprint
import typing

from handshake.services.DBService.lifecycle import (
    init_tortoise_orm,
    close_connection,
    set_default_config,
    config_file,
    READ_ONLY,
    ALLOW_WRITE,
)
from pathlib import Path
from typing import Dict
from handshake.services.DBService.models.config_base import ConfigKeys, ConfigBase
from tortoise.expressions import Q


def delete_test_attachment(run: UUID, attachmentFolder: Path):
    entry = attachmentFolder / str(run)
    if not entry.exists():
        return

    logger.warning("Deleting the attachments for run {}", run)
    rmtree(entry)


def dump_config(path: Path, to_dump: typing.List):
    formatted_dump: typing.Dict[str, str] = dict(to_dump)

    # not required
    for key in READ_ONLY:
        if key in formatted_dump:
            formatted_dump.pop(key)

    # show only required
    config_file(path).write_text(json.dumps(formatted_dump, indent=4))


async def setConfig(path: Path, feed: Dict[ConfigKeys, str], set_default: bool):
    await init_tortoise_orm(path)

    if set_default:
        await set_default_config(path)
    if feed:
        to_change = await ConfigBase.filter(Q(key__in=feed.keys())).all()
        for to in to_change:
            if to.key not in ALLOW_WRITE:
                continue

            to.value = feed[to.key]
            await ConfigBase.bulk_update(to_change, fields=["value"])

    to_dump = await ConfigBase.all().values_list()
    dump_config(path, to_dump)

    pprint.pprint(to_dump, indent=4)
    await close_connection()
