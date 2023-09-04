from typing import Union, List, Dict, Optional, Literal
from nextpyreports.services.DBService.models.enums import Status, SuiteType
from pydantic import BaseModel, field_validator
from datetime import datetime
from typing_extensions import TypedDict


def understand_js_date(utc_date_string: str) -> datetime:
    return datetime.strptime(utc_date_string, "%a, %d %b %Y %H:%M:%S %Z")


class CommonRegisterCols(BaseModel):
    retried: int
    started: datetime


class RegisterSession(CommonRegisterCols):
    browserName: str
    browserVersion: str
    platformName: str
    simplified: str
    sessionID: str
    specs: List[str]


class RegisterSuite(CommonRegisterCols):
    title: str
    fullTitle: str
    description: Optional[str] = ""
    suiteID: str
    suiteType: SuiteType
    session_id: str
    file: str
    parent: str
    standing: Union[Literal[Status.YET_TO_CALCULATE], Literal[Status.PENDING], Literal[Status.SKIPPED]]
    tags: Optional[List] = {}


class MarkSession(BaseModel):
    duration: float
    skipped: int
    passed: int
    failed: int
    tests: int
    hooks: int
    ended: datetime
    sessionID: str


class Error(TypedDict):
    name: str
    message: str
    stack: Optional[str]


class MarkSuite(BaseModel):
    duration: float
    ended: datetime
    suiteID: str
    error: Optional[Error] = None
    errors: Optional[List[Error]] = []
    standing: Optional[Status] = Status.SKIPPED
