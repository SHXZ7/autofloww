from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    workspace: Optional[str] = None
    timezone: Optional[str] = None
    notifications: Optional[Dict[str, bool]] = None

class User(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    is_active: bool = True
    profile: Optional[UserProfile] = None
    two_factor_enabled: Optional[bool] = False

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    is_active: bool
    profile: Optional[Dict[str, Any]] = None
    two_factor_enabled: Optional[bool] = False
    user: User
    token: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    profile: Optional[Dict[str, Any]] = None
