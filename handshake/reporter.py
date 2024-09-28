from httpx import Client
from datetime import datetime
from subprocess import Popen, PIPE
from typing import Union, Optional, Dict, List
from loguru import logger
from time import sleep
from sys import stdout, stderr
from pathlib import Path
from pytest import Session
from handshake.services.DBService.models.types import (
    CreatePickedSuiteOrTest,
    MarkSuite,
    MarkSession,
    MarkTestRun,
    AddAttachmentForEntity,
    PydanticModalForTestRunConfigBase,
    PydanticModalForTestRunUpdate,
    WrittenAttachmentForEntity,
    PydanticModalForCreatingTestRunConfigBase,
)
from threading import Lock
from concurrent.futures.thread import ThreadPoolExecutor
from concurrent.futures import Future
from httpx import Response, Timeout


def to_acceptable_date_format(date: datetime):
    return date.isoformat()


class CommonReporter:
    results: str
    port: str
    url: str
    client: Client
    collector: Popen
    postman: ThreadPoolExecutor
    started: Future
    skip: bool = False
    config_path: Optional[str] = None

    def __init__(self, path: str = "TestResults", port: Union[str, int] = 6969):
        self.note = dict()
        self.set_context(False, path, port)
        self.connection_established = False
        self.waiting = Lock()

    def ensure_mails(
        self, postman, url, note: Optional[Union[str, False]] = False, **kwargs
    ):
        try:
            if kwargs.get("json", False) and kwargs.get("append", False):
                kwargs["json"] = {
                    **kwargs["json"],
                    **{
                        refer_as: self.note.get(refer_to, "")
                        for refer_as, refer_to in kwargs["append"].items()
                    },
                }
            kwargs.pop("append") if "append" in kwargs else ...

            response: Response = postman(url, **kwargs)
            if response.status_code // 200 != 1:
                logger.warning(
                    "Request failed: {}, status: {}. response: {}",
                    url,
                    response.status_code,
                    response.text,
                )

            response.raise_for_status()
            if note:
                self.note[note] = response.text
            return response
        except Exception as error:
            logger.exception(
                "Failed to send request to {} with payload: {}. due to {}",
                url,
                kwargs,
                repr(error),
            )
            return False

    def parse_config(self, session: Session):
        rel_path = session.config.inicfg.get("save_results_in")
        port = session.config.inicfg.get("handshake_port")
        config_path = session.config.inicfg.get("save_handshake_config_dir")
        rel_to = Path(session.config.inipath.parent)

        self.set_context(
            True,
            (rel_to / rel_path).resolve() if rel_path else self.results,
            port if port else self.port,
            (rel_to / config_path).resolve() if config_path else None,
        )

    def set_context(
        self,
        set_client: bool,
        path: str,
        port: Union[str, int],
        config_path: Optional[str] = None,
    ):
        self.results = path
        self.port = str(port)
        self.client = Client() if set_client else ...

        self.postman = (
            ThreadPoolExecutor(max_workers=1, thread_name_prefix="post-")
            if set_client
            else ...
        )
        self.url = f"http://127.0.0.1:{port}"
        self.config_path = config_path

    def postfix(self, fix: str):
        return f"{self.url}/{fix}"

    def create_postfix(self, fix: str):
        return self.postfix(f"create/{fix}")

    def update_postfix(self, fix: str):
        return self.postfix(f"save/{fix}")

    def start_collection(self, projectName: str):
        command = (
            f'handshake run-app {projectName} "{self.results}" "{self.config_path}" -p {self.port}'
            if self.config_path
            else f'handshake run-app {projectName} "{self.results}" -p {self.port}'
        )
        self.collector = Popen(command, shell=True, stdout=stdout, stderr=stderr)
        logger.info("Starting handshake-server")
        self.started = self.postman.submit(self.wait_for_connection)

    def health_connection(self) -> bool:
        return self.collector.poll() is None

    def set_skip(self, error):
        # logger.error("Skipping Handshake reports, because {}", error)
        self.skip = True

    def wait_for_connection(self, retried: int = 1, force_call: bool = False):
        stack = [retried]
        with self.waiting:
            while stack:
                to_retry = stack.pop()
                try:
                    if self.skip and not force_call:
                        return
                    if not self.health_connection():
                        return not force_call and self.set_skip(
                            "Handshake server has closed."
                        )

                    self.client.get(
                        self.postfix(""),
                        timeout=60,
                    ).raise_for_status()
                    self.connection_established = True

                    not force_call and logger.debug(
                        "Connection established with handshake server."
                    )
                except Exception as _:
                    sleep(to_retry * 0.5)
                    if to_retry == 6:
                        return not force_call and self.set_skip(
                            "Failed to connect with handshake server, cancelling reports to send."
                        )
                    stack.append(to_retry + 1)

    def close_resources(self, force_call=False):
        with self.waiting:
            if force_call:
                return self.client.post(self.postfix("bye"))
            self.postman.submit(
                self.ensure_mails, self.client.post, self.postfix("bye"), False
            )
        self.postman.shutdown(wait=True, cancel_futures=False)
        logger.complete()

        if not self.skip:
            logger.debug("Handshake Reporter has collected your reports.")

    def call(
        self,
        reason: str,
        post_it: bool,
        postfix: str,
        payload: Dict,
        save_it: bool = False,
        append: Optional[Dict[str, str]] = None,
    ):
        logger.debug(reason)
        self.postman.submit(
            self.ensure_mails,
            self.client.post if post_it else self.client.put,
            (self.create_postfix if post_it else self.update_postfix)(postfix),
            postfix if save_it else False,
            json=payload,
            append=append,
        )

    def create_session(self, started: datetime):
        return self.call(
            "Creating test session",
            True,
            "Session",
            dict(started=to_acceptable_date_format(started)),
            True,
        )

    @property
    def session(self):
        return self.note["Session"]

    def add_run_config(self, payload: PydanticModalForCreatingTestRunConfigBase):
        return self.call(
            "Adding Configuration for your test run",
            True,
            "RunConfig",
            payload.model_dump(),
            True,
        )

    def update_test_session(self, payload: MarkSession):
        return self.call(
            "Updating Test Session",
            True,
            "RunConfig",
            payload.model_dump(),
        )

    def update_test_run(self, payload: MarkTestRun, force_call=False):
        if force_call:
            return self.client.put(
                self.update_postfix("Run"), json=payload.model_dump()
            )
        return self.call(
            "Updating Test Run",
            False,
            "Run",
            payload.model_dump(),
        )

    def register_test_suite(self, payload: Dict):
        return self.call(
            f"Registering a Test Suite: {payload['title']}",
            True,
            "Suite",
            payload,
            append=dict(session_id="Session"),
        )

    def force_wait(self):
        if not self.health_connection():
            return

        return self.wait_for_connection(1, True)
