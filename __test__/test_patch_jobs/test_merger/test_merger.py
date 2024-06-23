from tortoise.connection import connections
from subprocess import call


class TestMerger:
    async def test_normal_case(
        self,
        sample_test_session,
        create_session_with_hierarchy_with_no_retries,
        root_dir,
        root_dir_1,
    ):
        session = await sample_test_session
        suites = await create_session_with_hierarchy_with_no_retries(
            session.test_id,
        )
        print(suites)
        assert call(f'handshake merge "{root_dir_1}" -m "{root_dir}"', shell=True) == 0
        print(connections.all())
