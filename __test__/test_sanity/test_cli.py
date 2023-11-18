import platform

from pytest import mark
from __test__.test_regression.test_utils import TestSetConfigCommand


@mark.usefixtures("clean_close")
class TestCli:
    def test_dist_existence(self, dist):
        possible_location = dist

        target = platform.system()

        if target == "Windows":
            possible_location /= "graspit.exe"
        elif target == "Linux":
            possible_location /= "graspit"
        elif target == "Darwin":
            possible_location /= "graspit"
        else:
            assert False, f"{target} is not supported"

        assert possible_location.exists() is True, "Exe was not found"

    async def test_set_config_with_one_para(self, root_dir, dist):
        return await TestSetConfigCommand().test_set_config_with_one_para(
            root_dir, dist
        )
