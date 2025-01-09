import uuid
from typing import List, Optional, Union, Dict, Any
from handshake.services.DBService.models.enums import (
    Status,
    SuiteType,
    AttachmentType,
    RunStatus,
    LogType,
)
from pydantic import BaseModel
from datetime import datetime
from typing_extensions import TypedDict


# send an iso-format for the datetime string


class CommonRegisterCols(BaseModel):
    started: datetime


class Tag(TypedDict):
    label: str
    desc: str


class RegisterSession(CommonRegisterCols): ...


class RegisterSuite(CommonRegisterCols):
    title: str
    retried: int
    description: Optional[str] = ""
    suiteType: SuiteType
    expected: Optional[Status] = Status.PASSED
    session_id: uuid.UUID
    file: str
    parent: str
    tags: Optional[List[Tag]] = []


class CreatePickedSuiteOrTest(BaseModel):
    title: str
    retried: Optional[int] = 0
    started: Optional[datetime] = None
    description: Optional[str] = ""
    suiteType: SuiteType
    session_id: uuid.UUID
    file: str
    parent: str
    tags: Optional[List[Tag]] = []
    is_processing: Optional[bool] = True


class MarkSession(BaseModel):
    duration: float
    skipped: int
    passed: int
    failed: int
    tests: int
    hooks: int
    ended: datetime
    sessionID: uuid.UUID
    entityName: str
    entityVersion: str
    simplified: str


class UpdateSession(BaseModel):
    duration: float
    skipped: int
    passed: int
    failed: int
    tests: int
    hooks: int
    ended: datetime
    sessionID: uuid.UUID
    entityName: str
    entityVersion: str
    simplified: str


class Error(TypedDict):
    name: str
    message: str
    stack: Optional[str]


class UpdateSuite(BaseModel):
    suiteID: uuid.UUID
    duration: float
    started: Optional[datetime] = None
    expected: Optional[Status] = Status.PASSED
    ended: datetime
    errors: Optional[List[Error]] = []
    standing: Status


class PunchInSuite(CommonRegisterCols):
    suiteID: uuid.UUID


class MarkSuite(BaseModel):
    duration: float  # milliseconds
    ended: datetime
    suiteID: uuid.UUID
    errors: Optional[List[Error]] = []
    standing: Optional[Status] = Status.SKIPPED


class AssertionPayload(TypedDict):
    passed: bool
    wait: Optional[int]
    interval: Optional[int]


class LogPayload(TypedDict):
    type: LogType


# this is for all kinds of attachments
class AddAttachmentForEntity(BaseModel):
    entity_id: uuid.UUID
    type: AttachmentType
    description: Optional[str] = ""
    value: Union[AssertionPayload, LogPayload, str]
    title: Optional[str] = ""
    extraValues: Optional[Dict[Any, Any]] = {}
    tags: Optional[List[Tag]] = []


class WrittenAttachmentForEntity(BaseModel):
    entity_id: uuid.UUID
    type: AttachmentType
    description: Optional[str] = ""
    title: Optional[str] = ""


class ValueForTestRunConfigBase(TypedDict):
    version: str
    platformName: str


class PydanticModalForTestRunConfigBase(BaseModel):
    maxInstances: Optional[int] = 1
    platformName: str
    framework: str
    exitCode: int
    bail: Optional[int] = 0
    fileRetries: Optional[int] = 0
    avoidParentSuitesInCount: Optional[bool] = False
    tags: List[Tag]


class PydanticModalForCreatingTestRunConfigBase(BaseModel):
    maxInstances: Optional[int] = 1
    platform: str
    framework: str
    bail: Optional[int] = -1
    fileRetries: Optional[int] = 0
    avoidParentSuitesInCount: Optional[bool] = False
    tags: Optional[List[Tag]] = []


class PydanticModalForTestRunUpdate(CommonRegisterCols): ...


class MarkTestRun(BaseModel):
    exitCode: int
    status: RunStatus
