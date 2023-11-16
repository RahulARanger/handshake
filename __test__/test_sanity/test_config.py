from subprocess import call
from graspit.services.DBService.models.config_base import ConfigKeys, ConfigBase
from pytest import mark


@mark.usefixtures("clean_close")
class TestSetConfigCommand:
    async def test_set_config_with_one_para(self, root_dir, dist):
        call(
            f'graspit config "{root_dir}" -mr 6',
            cwd=dist,
            shell=True,
        )
        config_record = await ConfigBase.filter(key=ConfigKeys.maxRuns).first()
        assert int(config_record.value) == 6
