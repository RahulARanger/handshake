from pytest import fixture
from handshake.reporters.markers import set_info


@fixture(autouse=True, scope="session")
@set_info(
    name="sample setup 3",
    description="session fixture which is auto-used and returns 9",
)
def sample_setup_3():
    return 9
