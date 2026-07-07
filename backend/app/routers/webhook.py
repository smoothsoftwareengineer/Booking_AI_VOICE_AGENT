import json

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import CallLog, get_db
from app.retell_auth import verify_retell_signature

router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.post("")
async def handle_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        raw_body = (await request.body()).decode("utf-8")
        signature = request.headers.get("X-Retell-Signature")

        if not verify_retell_signature(raw_body, signature):
            return JSONResponse(status_code=401, content={"message": "Unauthorized"})

        post_data = json.loads(raw_body)
        event = post_data.get("event", "")
        call = post_data.get("call", {})
        call_id = call.get("call_id", "")

        if event == "call_started":
            db.add(CallLog(call_id=call_id, event=event))
        elif event == "call_ended":
            transcript = call.get("transcript", "")
            analysis = call.get("call_analysis") or {}
            db.add(
                CallLog(
                    call_id=call_id,
                    event=event,
                    summary=analysis.get("call_summary"),
                    transcript=transcript if isinstance(transcript, str) else json.dumps(transcript),
                )
            )
        elif event == "call_analyzed":
            analysis = call.get("call_analysis") or {}
            existing = db.query(CallLog).filter(CallLog.call_id == call_id).first()
            if existing:
                existing.summary = analysis.get("call_summary")
            else:
                db.add(
                    CallLog(
                        call_id=call_id,
                        event=event,
                        summary=analysis.get("call_summary"),
                    )
                )

        db.commit()
        return JSONResponse(status_code=204, content=None)
    except Exception as err:
        print(f"Webhook error: {err}")
        return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
