from pydantic import BaseModel
from typing import List, Dict, Union, TypedDict

Node = TypedDict("Node", {"<path>": str}, total=False)
PathTree = Dict[str, Union[Node, str]]


class PathItem(TypedDict):
    pointer: PathTree
    children: List[str]


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
