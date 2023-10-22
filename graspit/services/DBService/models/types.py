import base64
import uuid
from typing import Union, Iterable, List, Optional, Any
from graspit.services.DBService.models.enums import Status, SuiteType, AttachmentType
from pydantic import BaseModel
from datetime import datetime
from typing_extensions import TypedDict


class CommonRegisterCols(BaseModel):
    retried: int
    started: datetime


class RegisterSession(CommonRegisterCols):
    specs: List[str]


class RegisterSuite(CommonRegisterCols):
    title: str
    description: Optional[str] = ""
    suiteType: SuiteType
    session_id: uuid.UUID
    file: str
    parent: str
    tags: Optional[List] = []


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
    error: Optional[Error] = None
    errors: Optional[List[Error]] = []
    standing: Optional[Status] = Status.SKIPPED


class AddAttachmentForEntity(BaseModel):
    entityID: uuid.UUID
    type: AttachmentType
    description: Optional[str] = ""
    value: str
    color: Optional[str] = ""
    title: Optional[str] = ""


class ValueForTestRunConfigBase(TypedDict):
    version: str
    platformName: str


class PydanticModalForTestRunConfigBase(BaseModel):
    maxInstances: Optional[int]
    platformName: str
