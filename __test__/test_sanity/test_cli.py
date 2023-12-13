import platform

from pytest import mark
from __test__.test_regression.test_utils import TestSetConfigCommand


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
            root_dir, dist, dist_name
        )
