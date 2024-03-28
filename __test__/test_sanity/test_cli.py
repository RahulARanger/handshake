import platform
from handshake.services.DBService.models import ConfigBase
from handshake.services.DBService.models.enums import ConfigKeys
from subprocess import run
from pytest import mark
from __test__.test_utils import TestSetConfigCommand


@mark.usefixtures("clean_close")
class TestCli:
    def test_dist_existence(self, dist):
        path = dist
        target = platform.system()

        if target == "Windows":
            path /= f"handshake-{target}.exe"
        elif target == "Linux" or target == "Darwin":
            path /= f"handshake-{target}"
        else:
            assert False, f"{target} is not supported"

        assert path.exists() is True, "Exe was not found"

    async def test_set_config_with_one_para(self, root_dir, dist, dist_name):
        return await TestSetConfigCommand().test_set_config_with_one_para(
            root_dir, dist / dist_name, 30
        )


class TestMigration:
    async def test_migration(
        self, dist_name, root_dir, dist, get_vth_connection, scripts
    ):
        await get_vth_connection(scripts, 3)
        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 3

        result = run(
            [dist / dist_name, "migrate", root_dir.name],
            cwd=root_dir.parent,
        )
        assert result.returncode == 0

        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 7

    async def test_migration_on_patch(
        self, dist_name, root_dir, dist, get_vth_connection, scripts
    ):
        await get_vth_connection(scripts, 3)
        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 3

        result = run([dist / dist_name, "patch", root_dir.name], cwd=root_dir.parent)
        assert result.returncode == 0

        version = await ConfigBase.filter(key=ConfigKeys.version).first()
        assert int(version.value) == 7
