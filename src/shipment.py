import pathlib
import zipfile


def init_repo(name: pathlib.Path, parent_dir: pathlib.Path):
    results = parent_dir / name
    if results.exists():
        return
    results.mkdir()


def demo(name: str, dir_path: str, node: str) -> bool:
    package = pathlib.Path(__file__, "wdio-next-dashboard")

    packed = zipfile.ZipFile(package)
