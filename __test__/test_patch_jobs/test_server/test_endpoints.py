from datetime import timedelta
from pytest import mark
from handshake.services.DBService.models import (
    RunBase,
    SuiteBase,
)
from handshake.services.DBService.models.enums import SuiteType, Status
from sanic import Sanic
from asyncio import gather


@mark.usefixtures("sample_test_session")
class TestUpdateEndpoints:
    @staticmethod
    async def set_test_run(app: Sanic, test_run: RunBase):
        app.config.TEST_ID = test_run.testID
        return test_run

    async def test_setup_and_teardown_duration_update(
        self, client, sample_test_session, helper_create_test_run, create_suite, app
    ):
        await self.set_test_run(app, (await helper_create_test_run()))
        session = await sample_test_session

        parent_suite = await create_suite(session.sessionID)
        suite = await create_suite(session.sessionID, is_test=True)

        hook_duration = 10_000
        for parent in (parent_suite, suite):
            hooks = await gather(
                *[
                    create_suite(
                        session.sessionID,
                        hook=SuiteType.SETUP,
                        parent=parent.suiteID,
                        duration=timedelta(seconds=10),
                    )
                    for _ in range(2)
                ],
                create_suite(
                    session.sessionID,
                    hook=SuiteType.TEARDOWN,
                    parent=parent.suiteID,
                    duration=timedelta(seconds=10),
                ),
            )

            for _ in hooks:
                # this is only for simulating e2e scenario for testing
                # if we don't do that, server assumes the hook was updated before
                # and subtracts 10 seconds from what we supply
                _.duration = 0
                await _.save()

            payload = dict(
                duration=hook_duration,
                ended=hooks[0].ended.isoformat(),
                suiteID=str(hooks[0].suiteID),
                standing=Status.PASSED,
            )

            request, response = await client.put("/save/Suite", json=payload)
            assert response.status_code == 200, response.text

            suite = await SuiteBase.filter(suiteID=parent.suiteID).first()
            assert (
                suite.setup_duration == 10_000.0
            ), "hook's test will have updated setup duration"
            assert suite.teardown_duration == 0, "hook's test will not change"

        for rest in hooks[1:]:
            payload = dict(
                duration=hook_duration,
                ended=rest.ended.isoformat(),
                suiteID=str(rest.suiteID),
                standing=Status.PASSED,
            )
            request, response = await client.put("/save/Suite", json=payload)
            assert response.status_code == 200, response.text

        suite = await SuiteBase.filter(suiteID=suite.suiteID).first()
        assert (
            suite.setup_duration == 20_000.0
        ), "setup duration of hooked entity will be updated"
        assert (
            suite.teardown_duration == 10_000.0
        ), "teardown duration of hooked entity will also be updated"

        # now we are updating same hooks again
        for rest in hooks[1:]:
            payload = dict(
                duration=hook_duration + 5_000,
                ended=rest.ended.isoformat(),
                suiteID=str(rest.suiteID),
                standing=Status.PASSED,
            )
            request, response = await client.put("/save/Suite", json=payload)
            assert response.status_code == 200, response.text

        suite = await SuiteBase.filter(suiteID=suite.suiteID).first()
        assert (
            suite.setup_duration == 25_000.0
        ), "setup duration of parent entity would be updated accordingly"
        assert (
            suite.teardown_duration == 15_000.0
        ), "teardown duration of parent entity would be updated accordingly"
