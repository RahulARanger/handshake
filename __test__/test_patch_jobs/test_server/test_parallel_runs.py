from pytest import fixture
from handshake.services.DBService.lifecycle import models
from subprocess import Popen
from requests import Session, post
from datetime import datetime
from requests.adapters import HTTPAdapter, Retry
from pathlib import Path
from tortoise import Tortoise, connections
from handshake.services.DBService.models import RunBase, SessionBase, SuiteBase
from shutil import rmtree
from socket import socket


def find_free_port():
    with socket() as sock:
        sock.bind(("", 0))  # Bind to a free port provided by the host.
        return sock.getsockname()[1]  # Return the port number assigned.


@fixture()
def root_dir_server():
    return Path(__file__).parent / "TestMultipleServerResults"


@fixture(autouse=True)
async def shakes(get_db_path, root_dir_server):
    if root_dir_server.exists():
        rmtree(root_dir_server)

    first_sock = find_free_port()
    second_sock = find_free_port()
    result = Popen(
        f'handshake run-app test-app-1 "{root_dir_server}" -p {first_sock}', shell=True
    )
    result_2 = Popen(
        f'handshake run-app test-app-1 "{root_dir_server}" -p {second_sock}', shell=True
    )

    _session = Session()

    retries = Retry(total=50, backoff_factor=0.1, status_forcelist=[500, 502, 503, 504])
    _session.mount("http://", HTTPAdapter(max_retries=retries))
    response = _session.get(f"http://127.0.0.1:{first_sock}/")
    assert response.text == "1"
    response = _session.get(f"http://127.0.0.1:{second_sock}/")
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

    yield result, result_2, (first_sock, second_sock), session, connection

    try:
        if result.poll() is not None:
            post(f"http://127.0.0.1:{first_sock}/bye")

        if result_2.poll() is not None:
            post(f"http://127.0.0.1:{second_sock}/bye")
    except Exception as error:
        ...


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

    response = post(f"http://127.0.0.1:{ports[0]}/bye")
    assert response.text == "1"
    response = post(f"http://127.0.0.1:{ports[1]}/bye")
    assert response.text == "1"

    assert (await RunBase.all(using_db=connection).count()) == 2
    assert (await SessionBase.all(using_db=connection).count()) == 2
    assert (await SuiteBase.all(using_db=connection).count()) == 2 * 4
