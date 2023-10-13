from sqlite3.dbapi2 import Connection


# 1
def v2(connection: Connection):
    connection.executescript(
        "ALTER TABLE sessionbase rename column browserName to entityName;"
        "ALTER TABLE sessionbase rename column browserVersion to entityVersion;"
    )


def revert_v2(connection: Connection):
    connection.executescript(
        "ALTER TABLE sessionbase rename column entityName to browserName;"
        "ALTER TABLE sessionbase rename column entityVersion to browserVersion;"
    )
