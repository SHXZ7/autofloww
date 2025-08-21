from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class UserProfile(BaseModel):
    workspace: str = "My Workspace"
    plan: str = "Free Plan"
    workflow_count: int = 0
    execution_count: int = 0
    last_login: Optional[datetime] = None
    timezone: str = "UTC-5 (Eastern Time)"
    notifications: Dict[str, bool] = {
        "email": True,
        "workflow": True,
        "errors": True
    }

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    is_active: bool = True
    profile: Optional[UserProfile] = None

class UserResponse(BaseModel):
    user: User
    token: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    profile: Optional[Dict[str, Any]] = None
