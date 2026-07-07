import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from retell import Retell

from app.config import settings

router = APIRouter(prefix="/calls", tags=["calls"])

retell = Retell(api_key=settings.retell_api_key) if settings.retell_api_key else None


class WebCallRequest(BaseModel):
    agent_id: str | None = None


class WebCallResponse(BaseModel):
    access_token: str
    call_id: str


@router.post("/web", response_model=WebCallResponse)
def create_web_call(payload: WebCallRequest | None = None):
    if not retell:
        raise HTTPException(status_code=503, detail="Retell API key not configured")

    agent_id = (payload.agent_id if payload else None) or os.getenv("RETELL_AGENT_ID")
    if not agent_id:
        raise HTTPException(status_code=400, detail="Agent ID required")

    response = retell.call.create_web_call(agent_id=agent_id)
    return WebCallResponse(access_token=response.access_token, call_id=response.call_id)
