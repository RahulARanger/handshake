from pytest import mark


@mark.asyncio
class TestServerStatus:
    async def test_hi(self, app):
        request, response = await app.asgi_client.get("/")

        assert request.method.lower() == "get"
        assert response.body == b"1"
        assert response.status == 200

