from typing import Union, TypedDict, Optional, List, Dict
from src.services.DBService.models.enums import Status, SuiteType
from datetime import datetime


class CommonCols(TypedDict):
    duration: float
    retried: int
    totalRetries: int
    failures: int
    tests: int
    skipped: int
    passed: int
    standing: Status

    started: Union[datetime, str]
    ended: Optional[Union[datetime, str]]


class RegistersSession(CommonCols):
    sessionID: str
    suiteID: str
    browserName: str
    browserVersion: str
    platformName: str
    framework: str
    specs: List[str]
    suitesConfig: Dict[str, str]
    automationProtocol: str


class RegisterSuite(CommonCols):
    tags: str
    suiteType: SuiteType
    session_id: str
    suiteID: str
    title: str
    full_title: str
