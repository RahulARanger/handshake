from sqlmodel import Field, SQLModel


class RecordBase(SQLModel, table=True):
    id: Field(unique=True, primary_key=True)
    f_id: Field(foreign_key=True)


