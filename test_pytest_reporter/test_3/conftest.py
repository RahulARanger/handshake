from pytest import fixture


@fixture(scope="session", autouse=True)
def sample_setup_1():
    print("setup test 1")
    yield
    print("cleanup setup test 1")


@fixture(scope="session")
def sample_setup_2():
    print("setup test 2")


@fixture(scope="session")
def sample_setup_3(sample_setup_2):
    print("setup test 3")
