import json

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import Booking, get_db
from app.models import BookingCreate, BookingResponse
from app.retell_auth import verify_retell_signature

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("", response_model=list[BookingResponse])
def list_bookings(db: Session = Depends(get_db)):
    return db.query(Booking).order_by(Booking.created_at.desc()).all()


@router.post("/create", response_model=BookingResponse)
async def create_booking_function(request: Request, db: Session = Depends(get_db)):
    """Custom function endpoint called by Retell AI during a call."""
    try:
        raw_body = (await request.body()).decode("utf-8")
        signature = request.headers.get("X-Retell-Signature")

        if not verify_retell_signature(raw_body, signature):
            return JSONResponse(status_code=401, content={"message": "Unauthorized"})

        post_data = json.loads(raw_body)
        args = post_data.get("args", {})
        call = post_data.get("call", {})
        call_id = call.get("call_id")

        booking = Booking(
            caller_name=args.get("caller_name", "Unknown"),
            preferred_date=args.get("preferred_date", ""),
            preferred_time=args.get("preferred_time", ""),
            notes=args.get("notes"),
            call_id=call_id,
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)

        return {
            "result": f"Booking confirmed for {booking.caller_name} on {booking.preferred_date} at {booking.preferred_time}.",
            "booking_id": booking.id,
        }
    except Exception as err:
        print(f"Create booking error: {err}")
        return JSONResponse(status_code=500, content={"message": "Internal Server Error"})


@router.post("", response_model=BookingResponse)
def create_booking_manual(payload: BookingCreate, db: Session = Depends(get_db)):
    booking = Booking(**payload.model_dump())
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking
