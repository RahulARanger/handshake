from tortoise.models import Model
from tortoise.fields import JSONField, ForeignKeyField, ForeignKeyRelation
from nextpyreports.services.DBService.models.result_base import SuiteBase


class DynamicPicBase(Model):
    test: ForeignKeyRelation["SuiteBase"] = ForeignKeyField(
        "models.SuiteBase", related_name="test", to_field="suiteID"
    )
    jsonValue = JSONField(null=False, default=dict(value=""))
