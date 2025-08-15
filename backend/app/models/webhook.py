# backend/app/models/webhook.py

from pydantic import BaseModel
from typing import Dict, Any, Optional

class WebhookTrigger(BaseModel):
    workflow_id: str
    payload: Dict[str, Any]
    source: Optional[str] = None