from sqlite3.dbapi2 import Connection


# 1
def v2(connection: Connection):
    connection.executescript(
        "ALTER TABLE sessionbase rename COLUMN browserName to entityName;"
        "ALTER TABLE sessionbase rename COLUMN browserVersion to entityVersion;"
    )


def revert_v2(connection: Connection):
    connection.executescript(
        "ALTER TABLE sessionbase rename COLUMN entityName to browserName;"
        "ALTER TABLE sessionbase rename COLUMN entityVersion to browserVersion;"
    )


# 2
def revert_v3(connection: Connection):
    connection.executescript(
        "ALTER TABLE sessionbase DELETE COLUMN previous;"
        "ALTER TABLE suitebase DELETE COLUMN previous;"
    )


def v3(connection: Connection):
    connection.executescript(
        "ALTER TABLE sessionbase ADD COLUMN previous TEXT;"
        "ALTER TABLE suitebase ADD COLUMN previous TEXT;"
    )
