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


class SubSetOfRunBaseRequiredForProjectExport(BaseModel):
    testID: str
    tests: int
    passed: int
    skipped: int
    failed: int
    xfailed: int
    xpassed: int
    passedSuites: int
    failedSuites: int
    skippedSuites: int
    xfailedSuites: int
    xpassedSuites: int
    suites: int
    duration: float
    projectName: str
