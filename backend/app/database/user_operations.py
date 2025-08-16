from datetime import datetime
from typing import Optional, Dict, Any
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from .connection import get_database
from ..auth.auth import hash_password

async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new user in MongoDB"""
    try:
        db = get_database()
        users_collection = db.users
        
        # Hash the password
        hashed_password = hash_password(user_data["password"])
        
        # Prepare user document
        user_doc = {
            "name": user_data["name"],
            "email": user_data["email"].lower(),  # Store email in lowercase
            "password": hashed_password,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
            "profile": {
                "workspace": "My Workspace",
                "plan": "Free Plan",
                "workflow_count": 0,
                "execution_count": 0,
                "last_login": None
            }
        }
        
        # Insert user
        result = await users_collection.insert_one(user_doc)
        
        # Return user without password
        user_doc["_id"] = str(result.inserted_id)
        user_doc.pop("password")
        
        print(f"✅ User created successfully: {user_data['email']}")
        return user_doc
        
    except DuplicateKeyError:
        raise ValueError("User with this email already exists")
    except RuntimeError as e:
        print(f"❌ Database connection error: {str(e)}")
        raise RuntimeError("Database connection failed. Please check MongoDB connection.")
    except Exception as e:
        print(f"❌ Error creating user: {str(e)}")
        raise

async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    try:
        db = get_database()
        users_collection = db.users
        
        user = await users_collection.find_one({"email": email.lower()})
        
        if user:
            user["_id"] = str(user["_id"])
            
        return user
        
    except RuntimeError as e:
        print(f"❌ Database connection error: {str(e)}")
        return None
    except Exception as e:
        print(f"❌ Error finding user by email: {str(e)}")
        return None

async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    try:
        db = get_database()
        users_collection = db.users
        
        if not ObjectId.is_valid(user_id):
            return None
            
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        if user:
            user["_id"] = str(user["_id"])
            
        return user
        
    except RuntimeError as e:
        print(f"❌ Database connection error: {str(e)}")
        return None
    except Exception as e:
        print(f"❌ Error finding user by ID: {str(e)}")
        return None

async def update_user(user_id: str, update_data: Dict[str, Any]) -> bool:
    """Update user information"""
    try:
        db = get_database()
        users_collection = db.users
        
        if not ObjectId.is_valid(user_id):
            return False
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error updating user: {str(e)}")
        return False

async def update_user_stats(user_id: str, workflow_count: int = None, execution_count: int = None):
    """Update user workflow and execution statistics"""
    try:
        db = get_database()
        users_collection = db.users
        
        if not ObjectId.is_valid(user_id):
            return False
        
        update_data = {"updated_at": datetime.utcnow()}
        
        if workflow_count is not None:
            update_data["profile.workflow_count"] = workflow_count
            
        if execution_count is not None:
            update_data["profile.execution_count"] = execution_count
        
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error updating user stats: {str(e)}")
        return False

async def deactivate_user(user_id: str) -> bool:
    """Deactivate a user account"""
    try:
        db = get_database()
        users_collection = db.users
        
        if not ObjectId.is_valid(user_id):
            return False
        
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error deactivating user: {str(e)}")
        return False

async def update_last_login(user_id: str) -> bool:
    """Update user's last login timestamp"""
    try:
        db = get_database()
        users_collection = db.users
        
        if not ObjectId.is_valid(user_id):
            return False
        
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "profile.last_login": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error updating last login: {str(e)}")
        return False

async def get_user_count() -> int:
    """Get total number of users"""
    try:
        db = get_database()
        users_collection = db.users
        
        count = await users_collection.count_documents({})
        return count
        
    except Exception as e:
        print(f"❌ Error getting user count: {str(e)}")
        return 0
