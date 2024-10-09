from pytest import fixture
from handshake.services.DBService.lifecycle import models
from subprocess import Popen
from requests import Session, post
from datetime import datetime
from requests.adapters import HTTPAdapter, Retry
from pathlib import Path
from tortoise import Tortoise, connections
from handshake.services.DBService.models import RunBase, SessionBase, SuiteBase


@fixture()
def root_dir_server():
    return Path(__file__).parent / "TestServerResults"


@fixture(autouse=True)
async def shakes(get_db_path, root_dir_server):
    result = Popen(
        f'handshake run-app test-app-1 "{root_dir_server}" -p 6590', shell=True
    )
    result_2 = Popen(
        f'handshake run-app test-app-1 "{root_dir_server}" -p 6591', shell=True
    )

    _session = Session()

    retries = Retry(total=15, backoff_factor=0.1, status_forcelist=[500, 502, 503, 504])
    _session.mount("http://", HTTPAdapter(max_retries=retries))
    response = _session.get("http://127.0.0.1:6590/")
    assert response.text == "1"
    response = _session.get("http://127.0.0.1:6591/")
    assert response.text == "1"
    _session.close()

    session = Session()

    await Tortoise.init(
        {
            "connections": {
                _.stem: {
                    "engine": "tortoise.backends.sqlite",
                    "credentials": {"file_path": get_db_path(_)},
                }
                for _ in (root_dir_server,)
            },
            "apps": {
                "models": {"models": models, "default_connection": "default"},
            },
        }
    )
    await Tortoise.generate_schemas()

    connection = connections.get(root_dir_server.name)
    await RunBase.all(using_db=connection).delete()

    yield result, result_2, (6590, 6591), session, connection

    result.kill() if result.poll() is None else ...
    result_2.kill() if result_2.poll() is None else ...


async def test_multiple_sessions(
    shakes,
    createPts,
    updatePts,
):
    result, result_2, ports, session, connection = shakes

    # REGISTRATION OF SESSION

    sessions = []

    for port in ports:
        saved = datetime.now().isoformat()
        payload = dict(
            started=saved,
        )
        resp = session.post(createPts(port, "Session"), json=payload)
        assert resp.status_code == 201, resp.text
        sessions.append(resp.text)

    # REGISTRATION OF SUITE

    saved = datetime.now().isoformat()
    payloads = [
        dict(
            started=saved,
            title="sample-suite",
            retried=0,
            description="sample-description",
            suiteType="SUITE",
            session_id=_,
            file="./test.py",
            parent="",
            tags=[],
            is_processing=False,
        )
        for _ in sessions
    ]
    suites = []
    for payload, port in zip(payloads, ports):
        resp = session.post(createPts(port, "Suite"), json=payload)
        assert resp.status_code == 201, resp.text
        suites.append(resp.text)

    for suite, port in zip(suites, ports):
        resp = session.put(
            updatePts(port, "PunchInSuite"),
            json=dict(suiteID=suite, started=saved),
        )
        assert resp.status_code == 200, resp.text

    # REGISTRATION OF TESTS AND MARKING THEM

    for _session, suite, port in zip(sessions, suites, ports):
        for _ in range(3):
            saved = datetime.now().isoformat()
            payload = dict(
                started=saved,
                title=f"sample-test-{_}",
                retried=0,
                description="sample-description",
                suiteType="TEST",
                session_id=_session,
                file="./test.py",
                parent=suite,
                tags=[],
                is_processing=True,
            )

            resp = session.post(createPts(port, "Suite"), json=payload)
            assert resp.status_code == 201, resp.text

    response = post("http://127.0.0.1:6590/bye")
    assert response.text == "1"
    response = post("http://127.0.0.1:6591/bye")
    assert response.text == "1"

    assert (await RunBase.all(using_db=connection).count()) == 2
    assert (await SessionBase.all(using_db=connection).count()) == 2
    assert (await SuiteBase.all(using_db=connection).count()) == 2 * 4
