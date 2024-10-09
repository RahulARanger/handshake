from pytest import fixture


@fixture(autouse=True, scope="session")
def sample_setup_3():
    return 9
