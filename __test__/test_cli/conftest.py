from pathlib import Path
from pytest import fixture


@fixture()
def root_dir():
    return Path(__file__).parent / "TestCLIConfig"
