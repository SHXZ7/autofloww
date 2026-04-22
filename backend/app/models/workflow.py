# backend/app/models/workflow.py

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional


ALLOWED_NODES = {
    # AI (falls into the else → uses type string directly)
    "gpt",
    "claude", 
    "gemini",
    "llama",        # or whatever string you pass for llama
    
    # Integrations
    "webhook",
    "google_sheets",
    "file_upload",
    
    # Communication
    "email",
    "discord",
    "whatsapp",
    
    # Automation
    "schedule",
    "gmail_trigger",
    "delay",        # ← in your UI but no data handler yet, just add it
    
    # Utilities
    "document_parser",
    "report_generator",
    "image_generation",
    "social_media",
}



class Position(BaseModel):
    x: float
    y: float

    class Config:
        extra = "forbid"

class Node(BaseModel):
    id: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1)
    data: Dict[str, Any] = Field(default_factory=dict)
    position: Optional[Position] = None

    @validator("type")
    def validate_node_type(cls, value: str) -> str:
        if value not in ALLOWED_NODES:
            allowed = ", ".join(sorted(ALLOWED_NODES))
            raise ValueError(f"Invalid node type '{value}'. Allowed node types: {allowed}")
        return value

    class Config:
        extra = "forbid"

class Edge(BaseModel):
    id: Optional[str] = None
    source: str = Field(..., min_length=1)
    target: str = Field(..., min_length=1)
    type: Optional[str] = "default"
    animated: Optional[bool] = False
    style: Optional[Dict[str, Any]] = None
    markerEnd: Optional[Dict[str, Any]] = None

    class Config:
        extra = "forbid"

class Workflow(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    name: Optional[str] = None
    workflow_id: Optional[str] = None

    class Config:
        extra = "forbid"