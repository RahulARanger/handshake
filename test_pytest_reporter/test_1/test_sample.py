def test_dummy():
    assert 1 == 1


class TestDummy2:
    class TestDummy4:
        def test_dummy_5(self):
            print("this will run")
            assert 1 == 1

    def test_dummy_4(self):
        ...


def test_dummy_3():
    def test_dummy_4():  # this is ignored
        assert 1 == 1

    assert 1 == 1
