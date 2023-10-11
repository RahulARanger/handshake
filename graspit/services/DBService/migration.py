from sqlite3.dbapi2 import Connection


def version_0_0_1(connection: Connection):
    connection.execute(
        "ALTER TABLE sessionbase rename column browserName to entityName"
    )

    connection.execute(
        "ALTER TABLE sessionbase rename column browserVersion to entityVersion"
    )

    connection.execute("UPDATE ")
