# backend/app/models/workflow.py

from pydantic import BaseModel
from typing import List, Dict

class Node(BaseModel):
    id: str
    type: str
    data: Dict

class Edge(BaseModel):
    source: str
    target: str

class Workflow(BaseModel):
    nodes: List[Node]
    edges: List[Edge]