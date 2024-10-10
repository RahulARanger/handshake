from pytest import fixture
from time import sleep


def pytest_runtest_setup():
    print(1 / 0)


@fixture()
def sample_setup_3():
    print("before")
    from time import sleep

    sleep(6)
    yield 6
    print("after")
