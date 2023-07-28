from tortoise.models import Model
from tortoise import fields


class RecordBase(Model):
    feature_id = fields.CharField(max_length=255, pk=True)
    suite_id = fields.CharField(max_length=255)




