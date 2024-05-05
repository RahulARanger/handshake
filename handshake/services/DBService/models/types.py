import uuid
from typing import List, Optional, Union
from handshake.services.DBService.models.enums import Status, SuiteType, AttachmentType
from pydantic import BaseModel
from datetime import datetime
from typing_extensions import TypedDict

# send iso-format for the datetime string


class CommonRegisterCols(BaseModel):
    started: datetime


class Tag(TypedDict):
    name: str
    label: str


class RegisterSession(CommonRegisterCols):
    ...


class RegisterSuite(CommonRegisterCols):
    title: str
    retried: int
    description: Optional[str] = ""
    suiteType: SuiteType
    session_id: uuid.UUID
    file: str
    parent: str
    tags: Optional[List[Tag]] = []


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


class Error(TypedDict):
    name: str
    message: str
    stack: Optional[str]


class MarkSuite(BaseModel):
    duration: float
    ended: datetime
    suiteID: uuid.UUID
    errors: Optional[List[Error]] = []
    standing: Optional[Status] = Status.SKIPPED


class AssertionPayload(TypedDict):
    passed: bool
    wait: Optional[int]
    interval: Optional[int]
    message: str


# this is for all kinds of attachments
class AddAttachmentForEntity(BaseModel):
    entityID: uuid.UUID
    type: AttachmentType
    description: Optional[str] = ""
    value: Union[AssertionPayload, str]
    color: Optional[str] = ""
    title: Optional[str] = ""


class WrittenAttachmentForEntity(BaseModel):
    entityID: uuid.UUID
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
