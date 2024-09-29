from pytest import approx, raises


def test_dummy():
    assert 1 == 1


class TestDummy:
    def test_basic_assertions(self):
        assert 1 == 1
        assert [1] == [1]
        assert 1 in {1, 2}
        assert 1 in [1, 2]
        with raises(ValueError):
            [1, 2].index(3)
        assert 3 not in {1, 2}

    def test_nearly(self):
        assert 1.1 - 0.01 == approx(1, rel=0.1)
