from subprocess import run
from json import loads, dumps
from handshake.services.DBService.models.enums import ConfigKeys
from handshake.services.DBService.models import ConfigBase
from handshake.services.DBService.lifecycle import (
    TestConfigManager,
    db_path,
    DB_VERSION,
)


async def test_default_config_file(root_dir):
    target = root_dir / "handshake.json"
    target.unlink(missing_ok=True)
    assert not target.exists()
    await ConfigBase.filter(key=ConfigKeys.maxRunsPerProject).delete()
    run(
        f'handshake init "{root_dir}"',
        cwd=root_dir,
        shell=True,
    )
    assert target.exists()
    loaded = loads(target.read_text())
    assert loaded[ConfigKeys.maxRunsPerProject] == 10
    assert loaded["$schema"]
    assert len(loaded.keys()) == 2


async def test_import_from_handshake_file(root_dir):
    target = root_dir / "handshake.json"
    if not target.exists():
        run(
            f'handshake init "{root_dir}"',
            cwd=root_dir,
            shell=True,
        )
    assert target.exists()

    loaded = loads(target.read_text())
    loaded[ConfigKeys.maxRunsPerProject] = 10
    loaded[ConfigKeys.recentlyDeleted] = "1999"
    target.write_text(dumps(loaded))

    # any command that uses our ORM example: patch, config
    run(
        f'handshake export "{root_dir}"',
        cwd=root_dir,
        shell=True,
    )

    assert (
        await ConfigBase.filter(key=ConfigKeys.maxRunsPerProject).first()
    ).value == "10"
    assert (
        await ConfigBase.filter(key=ConfigKeys.recentlyDeleted).first()
    ).value != "1999"


async def test_init_script(root_dir):
    await ConfigBase.all().delete()
    assert await ConfigBase.all().count() == 0

    await TestConfigManager(db_path(root_dir)).sync(init_script=True)

    assert (await ConfigBase.filter(key=ConfigKeys.version).first()).value == str(
        DB_VERSION
    )
    assert (
        await ConfigBase.filter(key=ConfigKeys.recentlyDeleted).first()
    ).value == str(0)
    assert (
        int((await ConfigBase.filter(key=ConfigKeys.maxRunsPerProject).first()).value)
        > 1
    )
    assert (await ConfigBase.filter(key=ConfigKeys.reset_test_run).first()).value == ""

    assert (await ConfigBase.filter(key=ConfigKeys.version).first()).readonly == 1
    assert (
        await ConfigBase.filter(key=ConfigKeys.recentlyDeleted).first()
    ).readonly == 1
    assert (
        await ConfigBase.filter(key=ConfigKeys.maxRunsPerProject).first()
    ).readonly == 0
    assert (
        await ConfigBase.filter(key=ConfigKeys.reset_test_run).first()
    ).readonly == 1
