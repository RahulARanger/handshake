import typing

from handshake.services.DBService.models.result_base import RunBase
from handshake.services.DBService.models.config_base import TestConfigBase
from handshake.services.DBService.models.enums import AttachmentType
from httpx import AsyncClient


async def sendSummaryNotification(test_id: str):
    config = await TestConfigBase.filter(
        test_id=test_id, type=AttachmentType.CONFIG
    ).first()

    if not (config and config.attachmentValue.get("teamsHook", "")):
        return

    test_run = await RunBase.filter(testID=test_id).first()

    async with AsyncClient() as client:
        await client.post(
            config.attachmentValue["teamsHook"],
            json=summaryCard(
                test_run.projectName,
                test_run.standing,
                test_run.suiteSummary,
                test_run.passed,
                test_run.failed,
                test_run.skipped,
                test_run.tests,
            ),
        )


def summaryCard(
    projectName: str,
    standing: str,
    suiteSummary: typing.Dict[str, int],
    passed: int,
    failed: int,
    skipped: int,
    count: int,
):
    return {
        "type": "AdaptiveCard",
        "body": [
            {
                "type": "TextBlock",
                "size": "Medium",
                "weight": "Bolder",
                "text": f"{projectName} - Report",
            },
            {
                "type": "Container",
                "horizontalAlignment": "Left",
                "style": "default",
                "items": [
                    {
                        "type": "ColumnSet",
                        "columns": [
                            {
                                "type": "Column",
                                "width": "stretch",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": f"Status: {standing.lower()}",
                                        "wrap": True,
                                        "spacing": "Small",
                                        "separator": True,
                                        "maxLines": 1,
                                        "style": "default",
                                        "fontType": "Default",
                                        "size": "Medium",
                                        "color": "Good"
                                        if standing == "PASSED"
                                        else "Attention",
                                    }
                                ],
                            },
                            {
                                "type": "Column",
                                "width": "stretch",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "spacing": "None",
                                        "text": "Created {{DATE(${createdUtc},SHORT)}}",
                                        "isSubtle": True,
                                        "wrap": True,
                                        "style": "default",
                                        "fontType": "Default",
                                        "size": "Small",
                                        "color": "Dark",
                                    }
                                ],
                            },
                        ],
                    }
                ],
                "height": "stretch",
                "verticalContentAlignment": "Top",
            },
            {
                "type": "ActionSet",
                "actions": [
                    {
                        "type": "Action.OpenUrl",
                        "title": "Report",
                        "iconUrl": "https://img.icons8.com/external-outline-juicy-fish/60/"
                        "external-redirect-crisis-management-outline-outline-juicy-fish.png",
                        "url": "{{url}}",
                        "tooltip": "Report URL",
                    },
                    {
                        "type": "Action.ShowCard",
                        "title": "Test Suites",
                        "card": {
                            "type": "AdaptiveCard",
                            "body": [
                                {
                                    "type": "FactSet",
                                    "facts": [
                                        {
                                            "title": "Count",
                                            "value": suiteSummary.get("count", 0),
                                        },
                                        {
                                            "title": "Passed",
                                            "value": suiteSummary.get("passed", 0),
                                        },
                                        {
                                            "title": "Failed",
                                            "value": suiteSummary.get("passed", 0),
                                        },
                                        {
                                            "title": "Skipped",
                                            "value": suiteSummary.get("skipped", 0),
                                        },
                                    ],
                                    "spacing": "ExtraLarge",
                                    "separator": True,
                                    "height": "stretch",
                                }
                            ],
                        },
                        "tooltip": "Test Suites",
                        "mode": "secondary",
                        "iconUrl": "https://img.icons8.com/stickers/100/test.png",
                        "id": "TestSuites",
                    },
                    {
                        "type": "Action.ShowCard",
                        "title": "Test Cases",
                        "card": {
                            "type": "AdaptiveCard",
                            "body": [
                                {
                                    "type": "FactSet",
                                    "facts": [
                                        {"title": "Count", "value": count},
                                        {"title": "Passed", "value": passed},
                                        {"title": "Failed", "value": failed},
                                        {"title": "Skipped", "value": skipped},
                                    ],
                                }
                            ],
                        },
                        "style": "positive",
                        "iconUrl": "https://img.icons8.com/stickers/100/test.png",
                        "tooltip": "Test Cases",
                    },
                ],
            },
        ],
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.5",
    }
