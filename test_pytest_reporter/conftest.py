from pytest import fixture
from handshake.reporters.markers import set_info
from pytest import Config


def pytest_configure(config: Config):
    config.inicfg.setdefault("handshake_tag_ENV", "test")
    config.inicfg.setdefault("handshake_tag_TYPE", "Sample Test Framework")


@fixture(autouse=True, scope="session")
@set_info(
    name="sample setup 3",
    description="session fixture which is auto-used and returns 9",
)
def sample_setup_3():
    return 9
