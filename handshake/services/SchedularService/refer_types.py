from pydantic import BaseModel
from typing import List, Dict, Union, TypedDict, Optional

Node = TypedDict("Node", {"<path>": str, "<count>": Optional[int]}, total=False)


class PathTree(TypedDict):
    current: str
    suites: Optional[int]
    paths: Dict[str, "PathTree"]


class PathItem(TypedDict):
    pointer: PathTree
    children: List[str]
    count: int


class SuiteSummary(TypedDict):
    passed: int
    skipped: int
    count: int
    failed: int


class SubSetOfRunBaseRequiredForProjectExport(BaseModel):
    testID: str
    tests: int
    passed: int
    skipped: int
    failed: int
    suiteSummary: str
    duration: float
    projectName: str
