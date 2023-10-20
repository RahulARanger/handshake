from sqlite3.dbapi2 import Connection


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
