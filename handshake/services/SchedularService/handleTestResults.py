from typing import List
from loguru import logger
from handshake.services.SchedularService.constants import (
    writtenAttachmentFolderName,
)
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
)
from pathlib import Path
from typing import Dict
from handshake.services.DBService.models.config_base import ConfigKeys, ConfigBase
from tortoise.expressions import Q


def deleteTestRunsRelatedAttachments(data_base: Path, runs: List[str]):
    collection = data_base.parent / writtenAttachmentFolderName

    for _run in runs:
        run = str(_run)  # UUID to string

        entry = collection / run
        if not entry.exists():
            continue

        logger.warning("Deleting the attachments for run {}", run)
        rmtree(entry)


def moveTestRunsRelatedAttachment(testID: UUID, copyFrom: Path, copyTo: Path):
    test_id = copyFrom / str(testID)
    logger.warning("{} to {} for {}", copyFrom, copyTo, testID)

    if not test_id.exists():
        return

    return copytree(test_id, copyTo / str(testID), dirs_exist_ok=True)


def dump_config(path: Path, to_dump: typing.List):
    formatted_dump: typing.Dict[str, str] = dict(to_dump)

    # not required
    formatted_dump.pop(ConfigKeys.version)
    if ConfigKeys.recentlyDeleted in formatted_dump:
        formatted_dump.pop(ConfigKeys.recentlyDeleted)

    # show only required
    config_file(path).write_text(json.dumps(formatted_dump, indent=4))


async def setConfig(path: Path, feed: Dict[ConfigKeys, str], set_default: bool):
    await init_tortoise_orm(path)

    if set_default:
        await set_default_config(path)
    if feed:
        to_change = await ConfigBase.filter(Q(key__in=feed.keys())).all()
        for to in to_change:
            to.value = feed[to.key]
            await ConfigBase.bulk_update(to_change, fields=["value"])

    to_dump = await ConfigBase.all().values_list()
    dump_config(path, to_dump)

    pprint.pprint(to_dump, indent=4)
    await close_connection()
