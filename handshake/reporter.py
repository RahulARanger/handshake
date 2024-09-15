from httpx import Client
from datetime import datetime
from subprocess import Popen, PIPE
from typing import Union, Optional
from loguru import logger
from time import sleep
from sys import stdout, stderr
from handshake.services.DBService.models.types import (
    RegisterSuite,
    MarkSuite,
    MarkSession,
    MarkTestRun,
    AddAttachmentForEntity,
    PydanticModalForTestRunConfigBase,
    PydanticModalForTestRunUpdate,
    WrittenAttachmentForEntity,
    PydanticModalForCreatingTestRunConfigBase,
)
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

    def __init__(self, path: str = "TestResults", port: Union[str, int] = 6969):
        self.note = dict()
        self.set_context(False, path, port)

    def ensure_mails(
        self, postman, url, note: Optional[Union[str, False]] = False, **kwargs
    ):
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

    def set_context(self, set_client: bool, path: str, port: Union[str, int]):
        self.results = path
        self.port = str(port)
        self.client = Client() if set_client else ...

        self.postman = (
            ThreadPoolExecutor(max_workers=1, thread_name_prefix="post-")
            if set_client
            else ...
        )
        self.url = f"http://127.0.0.1:{port}"

    def postfix(self, fix):
        return f"{self.url}/{fix}"

    def create_postfix(self, fix):
        return self.postfix(f"create/{fix}")

    def update_postfix(self, fix):
        return self.postfix(f"save/{fix}")

    def start_collection(self, projectName: str):
        command = f"handshake run-app {projectName} {self.results} -p {self.port}"
        self.collector = Popen(command, shell=True, stdout=stdout, stderr=stderr)
        logger.info("Starting handshake-server")
        self.started = self.postman.submit(self.wait_for_connection)

    def health_connection(self) -> bool:
        return self.collector.poll() is None

    def set_skip(self, error):
        logger.error("Skipping Handshake reports, because {}", error)
        self.skip = True

    def wait_for_connection(self, retried: int = 1):
        try:
            if not self.health_connection():
                return self.set_skip("Handshake server has closed.")
            self.client.get(
                self.postfix(""),
                timeout=60,
            ).raise_for_status()
            logger.debug("Connection established with handshake server.")
        except Exception as _:
            sleep(retried * 0.5)
            if retried == 6:
                return self.set_skip(
                    "Failed to connect with handshake server, cancelling reports to send."
                )
            self.wait_for_connection(retried + 1)

    def close_resources(self):
        self.postman.submit(
            self.ensure_mails, self.client.put, self.postfix("done"), False
        )
        self.postman.submit(
            self.ensure_mails, self.client.post, self.postfix("bye"), False
        )
        self.postman.shutdown(wait=True, cancel_futures=False)
        logger.complete()
        logger.debug("Handshake Reporter has collected your reports.")

    def create_session(self, started: datetime):
        logger.debug("Creating test session")
        self.postman.submit(
            self.ensure_mails,
            self.client.post,
            self.create_postfix("Session"),
            "Session",
            json=dict(started=to_acceptable_date_format(started)),
        )

    def add_run_config(self, payload: PydanticModalForCreatingTestRunConfigBase):
        logger.debug("Adding Configuration for your test run")
        self.postman.submit(
            self.ensure_mails,
            self.client.post,
            self.create_postfix("RunConfig"),
            False,
            json=payload.model_dump(),
        )

    def update_test_session(self, payload: MarkSession):
        logger.debug("Updating Test Session")
        self.postman.submit(
            self.ensure_mails,
            self.client.post,
            self.update_postfix("RunConfig"),
            False,
            json=payload.model_dump(),
        )

    def update_test_run(self, payload: MarkTestRun):
        logger.debug("Updating Test Run")
        self.postman.submit(
            self.ensure_mails,
            self.client.put,
            self.update_postfix("Run"),
            False,
            json=payload.model_dump(),
        )
