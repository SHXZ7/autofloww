from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

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

class UserResponse(BaseModel):
    user: User
    token: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
