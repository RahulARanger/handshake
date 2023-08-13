import json
from pytest import mark


@mark.asyncio
class TestFeatureRecords:
    sample_path = json.dumps({"feature_path": "./spec.js"})

    async def test_add_feature(self, app):
        req, resp = await app.asgi_client.put("/save/addFeature", data=self.sample_path)
        assert req.method.lower() == "put"
        assert resp.body == b'1'
        assert resp.status == 201
        await self.add_feature_multiple_times(app)

    async def add_feature_multiple_times(self, app):
        req, resp = await app.asgi_client.put("/save/addFeature", data=self.sample_path)
        assert req.method.lower() == "put"
        assert resp.body == b'0'
        assert resp.status == 208

    async def test_missing(self, app):
        req, resp = await app.asgi_client.put("/save/addFeature", data="{}")
        assert req.method.lower() == "put"
        assert resp.status == 400
        body = resp.body.decode("utf-8")
        assert body == "Expected feature_path[str] from body but found nothing"
