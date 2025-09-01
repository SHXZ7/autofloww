# backend/app/models/workflow.py

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from nanoid import generate

class Node(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Optional[Dict[str, float]] = None

class Edge(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: f"edge_{generate(size=8)}")
    source: str
    target: str
    type: Optional[str] = "default"
    animated: Optional[bool] = False
    style: Optional[Dict[str, Any]] = None
    markerEnd: Optional[Dict[str, Any]] = None

class Workflow(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    
    class Config:
        # Allow arbitrary types for compatibility
        arbitrary_types_allowed = True