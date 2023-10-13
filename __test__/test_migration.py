from pytest import mark
from graspit.services.DBService.health import initiate_migration
from sqlite3 import connect
from click.testing import CliRunner
from graspit.handle_shipment import handle_cli


@mark.usefixtures("db_path")
class TestMigration:
    def test_revert_v1(self, db_path):
        initiate_migration(db_path, 1)
        connection = connect(db_path)

        result = connection.execute("pragma table_info(sessionbase)")
        structure = result.fetchall()

        assert structure[11][1] == "browserName"
        assert structure[12][1] == "browserVersion"

    @staticmethod
    def latest_version_assertion(db_path):
        connection = connect(db_path)

        result = connection.execute("pragma table_info(sessionbase)")
        structure = result.fetchall()

        assert structure[11][1] == "entityName"
        assert structure[12][1] == "entityVersion"

        connection.close()

    def test_bump_v2(self, db_path):
        initiate_migration(db_path, 2)
        self.latest_version_assertion(db_path)

    def test_cli_integration(self, db_path):
        runner = CliRunner()
        result = runner.invoke(
            handle_cli, ["db-version", "migrate", str(db_path.parent)]
        )
        assert result.exit_code == 0
        self.latest_version_assertion(db_path)
