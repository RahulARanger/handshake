from pytest import fixture
from pathlib import Path
from subprocess import run
from json import loads, dumps
from handshake.services.DBService.models.enums import ConfigKeys
from handshake.services.DBService.models import ConfigBase


@fixture()
def root_dir():
    return Path(__file__).parent.parent / "TestResultsConfig"


def test_default_config_file(root_dir):
    target = root_dir / "handshake.json"
    target.unlink(missing_ok=True)
    assert not target.exists()
    run(
        f'handshake config "{root_dir}"',
        cwd=root_dir,
        shell=True,
    )
    assert target.exists()
    loaded = loads(target.read_text())
    assert loaded[ConfigKeys.maxRunsPerProject] == "6"
    assert len(loaded.keys()) == 1


async def test_import_from_handshake_file(root_dir):
    target = root_dir / "handshake.json"
    if not target.exists():
        run(
            f'handshake config "{root_dir}"',
            cwd=root_dir,
            shell=True,
        )
    assert target.exists()

    loaded = loads(target.read_text())
    loaded[ConfigKeys.maxRunsPerProject] = "10"
    loaded[ConfigKeys.recentlyDeleted] = "1999"
    target.write_text(dumps(loaded))

    # any command that uses our ORM example: patch, config
    run(
        f'handshake patch "{root_dir}"',
        cwd=root_dir,
        shell=True,
    )

    assert (
        await ConfigBase.filter(key=ConfigKeys.maxRunsPerProject).first()
    ).value == "10"
    assert (
        await ConfigBase.filter(key=ConfigKeys.recentlyDeleted).first()
    ).value != "1999"
