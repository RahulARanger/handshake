from pathlib import Path
from typing import Union
from tomllib import loads
from asyncio import gather
from loguru import logger
from handshake.services.DBService.models import TaskBase, RunBase
from handshake.services.SchedularService.register import warn_about_test_run
from handshake.services.DBService.models.types import Tag


def to_lower( map_obj: dict):
    return {k.lower(): v for k, v in map_obj.items()}

def get_tag(tag: Union[str, Tag]) -> Tag:
    if type(tag) == str:
        return dict(label=tag, desc="")
    tag_obj = to_lower(tag)
    return dict(label=tag_obj.get("label", ""), desc=tag_obj.get("desc", tag_obj.get("description", "")))

def get_any_from_keys(pt: dict, *names):
    for name in names:
        if name in pt:
            return pt[name]
    return None

class LoadMetaFile:
    key: str
    project_specific: dict
    imported: dict
    test: RunBase

    def __init__(self, task: TaskBase):
        self.task: TaskBase = task

    async def start_import(self,  meta_file: Path):
        self.test = await RunBase.filter(testID=self.task.test_id).first()
        self.key = "_".join(str(self.test.projectName).split(" "))

        self.imported = to_lower(loads(meta_file.read_text()))
        self.project_specific = to_lower(self.imported.get(self.key.lower(), {}))
        await gather(self.import_to_run())

    def save_in_test(self, pt, key, save_to):
        save_as = pt.get(key, "")
        if save_as:
            setattr(self.test, save_to, save_as)

    def save_tags_in_test(self, pt):
        tags = [get_tag(_) for _ in get_any_from_keys(pt, "tags", "tag", "label", "labels")]
        if tags:
            self.test.tags = [*self.test.tags, *tags]

    async def import_to_run(self):
        about = to_lower(self.imported.get("about", {}))
        about.update(to_lower(self.project_specific.get("about", {})))

        self.save_in_test(about, "description", "projectDescription")
        self.save_in_test(about, "projectname", "projectName")
        self.save_tags_in_test(about)
        await self.test.save()

    async def mark_processed(self):
        self.task.processed = True
        await self.task.save()


async def load_from_meta(ticket, meta_file: str = ""):
    task = await TaskBase.filter(ticketID=ticket).first()

    meta = LoadMetaFile(task)
    passed = True
    reason = dict(fileExists=False, reason=f"File: {meta_file} does not exist")

    if not meta_file:
        passed = False

    if passed:
        meta_file = Path(meta_file)
        if not meta_file.exists():
            passed= False

    if passed:
        try:
            await meta.start_import(meta_file)
        except Exception as error:
            logger.exception("Failed to import Meta File")
            reason["fileExists"] = True
            reason["reason"] = repr(error)
            passed = False

    if meta_file and not passed:
        await warn_about_test_run(task.test_id, "Failed to import Test Meta", task.type, False, **reason)

    await meta.mark_processed()
    return passed
