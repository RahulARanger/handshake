from httpx import Client
from datetime import datetime
from subprocess import Popen
from typing import Union, Optional, Dict, List
from loguru import logger
from time import sleep
from sys import stdout, stderr
from handshake.services.DBService.models.types import (
    MarkTestRun,
    PydanticModalForCreatingTestRunConfigBase,
)
from threading import Lock
from concurrent.futures.thread import ThreadPoolExecutor
from concurrent.futures import Future
from httpx import Response


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
        self.lock_attachments = Lock()
        self.connection_established = False
        self.waiting = Lock()
        self.attachments: List[Dict] = []

    def postfix(self, fix: str):
        return f"{self.url}/{fix}"

    def create_postfix(self, fix: str):
        return self.postfix(f"create/{fix}")

    def update_postfix(self, fix: str):
        return self.postfix(f"save/{fix}")

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

            if kwargs.get("json", False) and kwargs.get("map_value", False):
                for change_for in kwargs["json"]:
                    before = change_for[kwargs["map_value"]]
                    change_for[kwargs["map_value"]] = self.note[before]

            for to_pop in ("append", "map_value"):
                kwargs.pop(to_pop) if to_pop in kwargs else ...

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

    def start_collection(self, project_name: str, is_quiet: bool):
        postfix = " " + ("" if is_quiet else "-vb")
        command = (
            f'handshake run-app {project_name} "{self.results}" "{self.config_path}" -p {self.port}'
            if self.config_path
            else f'handshake run-app {project_name} "{self.results}" -p {self.port}'
        ) + postfix
        self.collector = Popen(command, shell=True, stdout=stdout, stderr=stderr)
        logger.debug("Starting handshake-server, {}", command)
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
                        return None
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
            return None

    def call(
        self,
        reason: str,
        post_it: bool,
        postfix: str,
        payload: Union[Dict, List],
        save_it: Optional[str] = None,
        map_value: str = None,
        append: Optional[Dict[str, str]] = None,
    ):
        logger.debug(reason)
        self.postman.submit(
            self.ensure_mails,
            self.client.post if post_it else self.client.put,
            (self.create_postfix if post_it else self.update_postfix)(postfix),
            save_it if save_it else False,
            json=payload,
            append=append,
            map_value=map_value,
        )

    def create_session(self, started: datetime):
        return self.call(
            "Creating test session",
            True,
            "Session",
            dict(started=to_acceptable_date_format(started)),
            "Session",
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
        )

    def register_test_entity(
        self, payload: Dict, save_in: str, parent: Optional[str] = None
    ):
        to_append = dict(session_id="Session")
        if parent:
            to_append["parent"] = parent

        return self.call(
            f"Registering a Test Entity: {payload['title']}",
            True,
            "Suite",
            payload,
            save_in,
            append=to_append,
        )

    def update_test_entity(
        self, payload, node_id: str, punch_in: Optional[bool] = False
    ):
        self.send_chunk_of_attachments()
        return self.call(
            f"Updating Test Entity: {node_id}",
            False,
            "PunchInSuite" if punch_in else "Suite",
            payload,
            append=dict(suiteID=node_id),
        )

    def send_chunk_of_attachments(self):
        with self.lock_attachments:
            if not self.attachments:
                return

            self.call(
                "Sending chunk of attachments",
                True,
                "Attachments",
                [*self.attachments],
                map_value="entity_id",
            )
            self.attachments.clear()

    def update_test_session(self, payload: Dict):
        return self.call(
            "Updating Test Session",
            False,
            "Session",
            payload,
            append=dict(sessionID="Session"),
        )

    def update_test_run(self, payload: MarkTestRun, force_call=False):
        if force_call:
            return self.client.put(
                self.update_postfix("Run"), json=payload.model_dump()
            )
        else:
            self.send_chunk_of_attachments()
        return self.call(
            "Updating Test Run",
            False,
            "Run",
            payload.model_dump(),
        )

    def force_wait(self):
        if not self.health_connection():
            return None

        return self.wait_for_connection(1, True)

    def close_resources(self, force_call=False):
        with self.waiting:
            if force_call:
                return self.client.post(self.postfix("bye"))
            else:
                self.send_chunk_of_attachments()
            self.postman.submit(
                self.ensure_mails, self.client.post, self.postfix("bye"), False
            )
        self.postman.shutdown(wait=True, cancel_futures=False)
        logger.complete()

        if not self.skip:
            logger.debug("Handshake Reporter has collected your reports.")
        return None
