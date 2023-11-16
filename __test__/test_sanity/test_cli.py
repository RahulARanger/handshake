from pytest import mark
from __test__.test_regression.test_utils import TestSetConfigCommand


@mark.usefixtures("clean_close")
class TestCli:
    def test_dist_existence(self, dist):
        assert dist.exists()

    async def test_set_config_with_one_para(self, root_dir, dist):
        return await TestSetConfigCommand().test_set_config_with_one_para(
            root_dir, dist
        )
