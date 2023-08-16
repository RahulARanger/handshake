from tortoise.models import Model
from tortoise import fields
from src.services.DBService.models.types import Status


class TestResults(Model):
    testId = fields.UUIDField(pk=True)
    started = fields.DatetimeField(null=False)
    ended = fields.DatetimeField(null=True)
    projectName = fields.CharField(max_length=30, null=False, description="Name of the project")
    collectionName = fields.CharField(max_length=30, null=False, description="Label for this project")
    standing = fields.CharEnumField(Status, description="status of the test run", default=Status.PENDING)
    instances = fields.IntField(default=1, description="Number of instances used")

