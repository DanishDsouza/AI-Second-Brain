from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1)


class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1)
    limit: int = Field(default=5, ge=1, le=5)


class NoteRead(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    tags: list[str]
    summary: str
    created_at: datetime
    updated_at: datetime


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)


class ChatSource(BaseModel):
    id: int
    title: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
