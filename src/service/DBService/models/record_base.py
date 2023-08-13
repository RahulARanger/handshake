from enum import StrEnum
from typing import Optional, TypedDict, Any
from tortoise.models import Model
from tortoise import fields


class SuiteStatus(StrEnum):
    PASSED = "PASSED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"


class FeatureBase(Model):
    feature_id = fields.UUIDField(pk=True, description="ID assigned to the feature, alias spec file")
    feature_path = fields.CharField(max_length=255, description="File path for the feature file", unique=True)
    records: fields.ReverseRelation["SuiteBase"]

    def __str__(self):
        return f"{self.feature_path}[{self.feature_id}, {self.records}]"


class SuiteBase(Model):
    suite_id = fields.UUIDField(
        pk=True, description="id assigned to the Test Suite, alias Scenario")
    feature_id: fields.ForeignKeyRelation[FeatureBase] = fields.ForeignKeyField(
        "models.FeatureBase", related_name="records"
    )
    suite_title = fields.CharField(max_length=225, null=False)
    suite_full_title = fields.CharField(max_length=225, null=False)
    # suite_parent = fields.CharField(max_length=40, null=True)
    duration = fields.FloatField()


class InitSuiteProtocol(TypedDict):
    feature_path: str
    suite_title: str
    suite_full_title: str
    duration: Optional[float]
    body: Any
