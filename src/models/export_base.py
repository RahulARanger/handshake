from sqlmodel import SQLModel, Field


class ExportBase(SQLModel, table=True):
    id = Field(unique=True, primary_key=True, foreign_key=True)