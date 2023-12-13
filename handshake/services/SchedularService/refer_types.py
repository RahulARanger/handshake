from typing import TypedDict, List, Dict, Union

Node = TypedDict(
    "Node", {
        "<path>": str
    }, total=False
)
PathTree = Dict[str, Union[Node, str]]


class PathItem(TypedDict):
    pointer: PathTree
    children: List[str]
