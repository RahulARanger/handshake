from tortoise.contrib import test
from tortoise import Tortoise
from src.service.DBService.models import FeatureBase


class TestFeatureBase(test.TestCase):
    async def test_init(self):
        assert self._db.connection_name == "models"

        await Tortoise.generate_schemas()
        # there are no errors while generating the schemas

    async def test_feature(self):
        await FeatureBase.create(feature_path="./spec.js")
        record = await FeatureBase.filter(feature_path="./spec.js").first()

        assert record.feature_id is not None
        assert record.feature_path == "./spec.js"

    @test.expectedFailure
    async def test_required_feature_path(self):
        await FeatureBase.create()



