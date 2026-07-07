from datetime import datetime

from pydantic import BaseModel


class BookingCreate(BaseModel):
    caller_name: str
    preferred_date: str
    preferred_time: str
    notes: str | None = None


class BookingResponse(BaseModel):
    id: int
    caller_name: str
    preferred_date: str
    preferred_time: str
    notes: str | None
    call_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CallLogResponse(BaseModel):
    id: int
    call_id: str
    event: str
    caller_name: str | None
    reason: str | None
    summary: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
