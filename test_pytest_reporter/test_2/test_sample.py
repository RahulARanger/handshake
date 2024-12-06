from pytest import approx, raises, mark, skip
from handshake.reporters.markers import set_info


def test_dummy():
    assert 1 == 1


@mark.skip(reason="this is skipped")
def test_the_skip():
    assert 1 == 1


def test_the_skip_based_on_condition():
    skip("skipped inside the call")


@mark.parametrize("param", [1, 2])
@mark.parametrize("x", ["a", "b"])
@set_info(
    name="test_parameterize_hook",
    description="Testing how we handle the parametrize hook given by pytest",
    **{
        "a-1": dict(name="first-test", description="with param as 1 and x as a"),
        "b-1": dict(name="first-test-in-b", description="with param as 1 and x as b"),
    }
)
def test_param(param, x):
    print(param, x)


class TestDummy:
    def test_basic_assertions(self):
        assert 1 == 1
        assert [1] == [1]
        assert 1 in {1, 2}
        assert 1 in [1, 2]
        with raises(AssertionError):
            assert 3 in [
                1,
                2,
            ], "this will fail, but we are expecting this AssertionError"
        assert 3 not in {1, 2}

    def test_nearly(self):
        assert 1.1 - 0.01 == approx(1, rel=0.1)
