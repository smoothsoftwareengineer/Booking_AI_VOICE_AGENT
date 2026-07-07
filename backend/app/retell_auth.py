import os

from retell import Retell

from app.config import settings

retell_client = Retell(api_key=settings.retell_api_key) if settings.retell_api_key else None


def verify_retell_signature(raw_body: str, signature: str | None) -> bool:
    if not retell_client or not settings.retell_api_key:
        return os.getenv("SKIP_WEBHOOK_VERIFY", "").lower() == "true"
    return retell_client.verify(raw_body, api_key=settings.retell_api_key, signature=signature or "")
