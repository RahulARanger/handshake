import json
from datetime import timedelta
from pytest import mark
from handshake.services.DBService.models import (
    RunBase,
    SuiteBase,
    AttachmentBase,
    TestLogBase,
    AssertBase,
    TestConfigBase,
    EntityLogBase,
)
from handshake.services.DBService.models.enums import SuiteType, Status
from sanic import Sanic
from asyncio import gather
from __test__.test_patch_jobs.test_server.commons import set_config
from handshake.services.DBService.models.enums import (
    LogType,
    AttachmentType,
    LogGeneratedBy,
)


@mark.usefixtures("sample_test_session")
class TestUpdateEndpoints:
    @staticmethod
    async def set_test_run(app: Sanic, test_run: RunBase):
        app.config.TEST_ID = test_run.testID
        return test_run

    async def test_expectation_for_skipped_test(
        self, client, sample_test_session, helper_create_test_run, create_suite, app
    ):
        await self.set_test_run(app, (await helper_create_test_run()))
        session = await sample_test_session

        parent_suite = await create_suite(session.sessionID)
        suite = await create_suite(
            session.sessionID, is_test=True, parent=parent_suite.suiteID
        )
        suite_2 = await create_suite(
            session.sessionID,
            is_test=True,
            parent=parent_suite.suiteID,
            expected=Status.FAILED,
        )

        for _ in (suite, suite_2):
            payload = dict(
                duration=_.duration,
                ended=_.ended.isoformat(),
                suiteID=str(_.suiteID),
                standing=Status.SKIPPED,
            )

            request, response = await client.put("/save/Suite", json=payload)
            assert response.status_code == 200, response.text

        suite = await SuiteBase.filter(suiteID=suite.suiteID).first()
        assert (
            suite.expected == Status.SKIPPED
        ), "test's expectation must now be skipped state"
        assert suite.expected == Status.PASSED

        suite = await SuiteBase.filter(suiteID=suite_2.suiteID).first()
        assert suite.expected == Status.FAILED
        assert (
            suite.expected == Status.FAILED
        ), "test's expectation must remain as failed, since it's expectation is not to pass"

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
            hook_record = await SuiteBase.filter(suiteID=rest.suiteID).first()

            if rest.suiteType == SuiteType.SETUP:
                assert (
                    hook_record.setup_duration
                    == hook_record.duration
                    == hook_duration + 5_000
                )
                assert hook_record.teardown_duration == 0
            else:
                assert (
                    hook_record.teardown_duration
                    == hook_record.duration
                    == hook_duration + 5_000
                )
                assert hook_record.setup_duration == 0

        suite = await SuiteBase.filter(suiteID=suite.suiteID).first()
        assert (
            suite.setup_duration == 25_000.0
        ), "setup duration of parent entity would be updated accordingly"
        assert (
            suite.teardown_duration == 15_000.0
        ), "teardown duration of parent entity would be updated accordingly"

    @mark.usefixtures("sample_test_session")
    class TestAttachmentEndpoints:
        url = "/create/Attachments"

        async def test_empty_attachments(self, client, app, sample_test_session):
            await set_config(app, sample_test_session)
            payload = []
            request, response = await client.post(self.url, json=payload)
            assert response.status == 201

        async def test_bulk_attachments(
            self, app, client, sample_test_session, create_suite
        ):
            session = await set_config(app, sample_test_session)
            suite = await create_suite(session.sessionID)

            payload = [
                dict(
                    entity_id=str(suite.suiteID),
                    type=AttachmentType.LINK,
                    value="https://test.com",
                    title="test-link",
                ),
                dict(
                    entity_id=str(suite.suiteID),
                    type=AttachmentType.LINK,
                    value="https://test-2.com",
                ),
                dict(
                    entity_id=str(suite.suiteID),
                    type=AttachmentType.LOG,
                    description="hello there, adding a note here",
                    title="Hey 😁",
                    value=dict(
                        type=LogType.INFO,
                    ),
                ),
                dict(
                    entity_id=str(suite.suiteID),
                    type=AttachmentType.ASSERT,
                    title="toExist",
                    description="This log existed",
                    value=dict(
                        passed=True,
                    ),
                ),
                dict(
                    entity_id=str(suite.suiteID),
                    type=AttachmentType.ASSERT,
                    title="toExist",
                    description="This log existed",
                    value=dict(
                        passed=True,
                        wait=500,
                        interval=69,
                    ),
                ),
                dict(
                    entity_id=str(suite.suiteID),
                    type=AttachmentType.DESC,
                    value="sample-description",
                    title="sample-title",
                    tags=[
                        dict(label="desc", desc=""),
                        dict(label="info", desc="sample info"),
                    ],
                ),
                dict(
                    entity_id=str(suite.suiteID),
                    description="sample-description",
                    type=AttachmentType.LABEL,
                    value="sample-label",
                    extraValues={"color": "red"},
                ),
            ]
            request, response = await client.post(self.url, json=payload)
            assert response.status == 201, "Request should pass as expected"

            # all attachments
            assert await AttachmentBase.filter(entity_id=suite.suiteID).count() == 4
            assert await AssertBase.filter(entity_id=suite.suiteID).count() == 2

            # first two attachments
            #
            link = await AttachmentBase.filter(
                type=AttachmentType.LINK, entity_id=suite.suiteID
            ).first()
            assert link.value == "https://test.com"
            assert link.type == AttachmentType.LINK

            link_2 = await AttachmentBase.filter(
                type=AttachmentType.LINK,
                entity_id=suite.suiteID,
                title="",
            ).first()
            assert (
                link_2.value == "https://test-2.com" and link_2.title == ""
            ), "Values are not tampered"
            assert link_2.type == AttachmentType.LINK

            # assertions added
            assert await AssertBase.filter(entity_id=suite.suiteID).count() == 2
            assert await AssertBase.exists(
                entity_id=suite.suiteID,
                message="This log existed",
                interval=69,
                wait=500,
                title="toExist",
                passed=True,
            )
            assert await AssertBase.exists(
                entity_id=suite.suiteID,
                message="This log existed",
                title="toExist",
                interval=-1,
                wait=-1,
                passed=True,
            )

            assert await EntityLogBase.exists(
                entity_id=suite.suiteID,
                message="hello there, adding a note here",
                title="Hey 😁",
                type=LogType.INFO,
                generatedByGroup=LogGeneratedBy.USER,
                generatedBy="User",
            )

            desc = await AttachmentBase.filter(
                type=AttachmentType.DESC, entity_id=suite.suiteID
            ).first()
            assert desc.value == "sample-description"
            assert desc.type == AttachmentType.DESC
            assert desc.extraValues == {}
            assert desc.title == "sample-title"
            assert desc.tags == [
                dict(label="desc", desc=""),
                dict(label="info", desc="sample info"),
            ]

            label = await AttachmentBase.filter(
                type=AttachmentType.LABEL, entity_id=suite.suiteID
            ).first()
            assert label.value == "sample-label"
            assert label.type == AttachmentType.LABEL
            assert label.extraValues["color"] == "red"

        async def test_bulk_attachments_with_errors(
            self, app, client, sample_test_session, create_suite
        ):
            session = await set_config(app, sample_test_session)

            suite = await create_suite(session.sessionID)
            second_suite = await create_suite(session.sessionID)

            first_error_payload = dict(
                entity_id=str(suite.suiteID), type=AttachmentType.ASSERT, value=dict()
            )
            expected_error_payload = dict(
                entity_id=str(suite.suiteID),
                type=AttachmentType.ASSERT,
                value=dict(wait=-1, interval=-1),
            )

            second_error_payload = dict(
                description="sample-description",
                type=AttachmentType.LABEL,
                value="sample-label",
                color="red",
            )

            payload = [
                dict(
                    entity_id=str(suite.suiteID),
                    type=AttachmentType.LINK,
                    value="https://test.com",
                ),  # correct ones
                first_error_payload,
                dict(
                    entity_id=str(second_suite.suiteID),
                    type=AttachmentType.DESC,
                    value="sample-description",
                    title="sample-title",
                ),  # correct ones
                second_error_payload,
            ]

            request, response = await client.post(self.url, json=payload)
            assert response.status == 206

            assert await AttachmentBase.filter(entity_id=suite.suiteID).count() == 1
            assert (
                await AttachmentBase.filter(entity_id=second_suite.suiteID).count() == 1
            )

            test_id = str((await session.test).testID)
            assert await TestLogBase.filter(test_id=test_id).count() == 2

            first, second = await TestLogBase.filter(
                test_id=test_id, type=LogType.WARN
            ).all()

            assert first.feed["url"].endswith(self.url)
            assert first.feed["payload"] == expected_error_payload

            assert "missing" in first.feed["reason"]
            assert "value" in first.feed["reason"]

            assert second.feed["url"].endswith(self.url)
            assert second.feed["payload"] == second_error_payload

            assert "missing" in first.feed["reason"]
            assert "entity_id" in second.feed["reason"]


@mark.usefixtures("sample_test_session")
class TestSaveEndPoints:
    @staticmethod
    async def set_test_run(app: Sanic, test_run: RunBase):
        app.config.TEST_ID = test_run.testID
        return test_run

    async def test_we_have_pydantic_in_place(self, client, helper_create_test_run, app):
        await self.set_test_run(app, (await helper_create_test_run()))

        payload = dict(simplified="sample")
        request, response = await client.put("/save/Session", json=payload)

        result = response.json
        assert response.status == 400

        required = {
            "duration",
            "skipped",
            "passed",
            "failed",
            "tests",
            "entityName",
            "entityVersion",
            "ended",
            "hooks",
            "sessionID",
        }

        reasons = json.loads(result["reason"])
        assert len(reasons) == len(required)

        for missing in reasons:
            assert missing["type"] == "missing"
            assert missing["loc"][0] in required
            assert missing["msg"] == "Field required"
            assert missing["input"] == payload

    async def test_set_config_api(self, client, helper_create_test_run, app):
        test = await self.set_test_run(app, (await helper_create_test_run()))

        payload = dict(
            maxInstances=1,
            fileRetries=1,
            framework="pytest",
            exitCode=1,
            bail=1,
            platformName="windows",
            tags=[{"label": "*.py", "desc": "only py file"}],
            avoidParentSuitesInCount=False,
        )
        request, response = await client.put("/save/currentRun", json=payload)
        assert response.status == 200, response.text

        record = await TestConfigBase.filter(test_id=test.testID).first()
        assert record is not None
        test = await record.test
        assert test.exitCode == 1
        assert record.platform == "windows"
        assert record.maxInstances == 1
        assert record.fileRetries == 1
        assert record.avoidParentSuitesInCount is False
