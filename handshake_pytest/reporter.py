from datetime import datetime
from handshake.reporter import CommonReporter
from handshake.services.DBService.models.types import (
    PydanticModalForCreatingTestRunConfigBase,
)
from pytest import Session
from platform import platform


class PyTestHandshakeReporter(CommonReporter):
    def put_test_config(self, session: Session):
        return self.add_run_config(
            PydanticModalForCreatingTestRunConfigBase(
                framework="pytest",
                platform=platform(),
            )
        )
