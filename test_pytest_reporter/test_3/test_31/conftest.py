from pytest import fixture
from time import sleep


@fixture()
def sample_setup_3():
    print("before")
    yield 6
    print("after")
