from datetime import datetime
from typing import Optional, Dict, Any
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from app.database.connection import get_database, db
from app.auth.auth import hash_password

async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new user in MongoDB"""
    try:
        database = get_database()
        users_collection = database.users
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user_data["email"]})
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Hash password
        hashed_password = hash_password(user_data["password"])
        
        # Create user document
        user_doc = {
            "name": user_data["name"],
            "email": user_data["email"],
            "password": hashed_password,
            "created_at": datetime.utcnow(),
            "is_active": True,
            "profile": {
                "workspace": f"{user_data['name']}'s Workspace",
                "plan": "Free Plan",
                "workflow_count": 0,
                "execution_count": 0,
                "timezone": "UTC-5 (Eastern Time)",
                "notifications": {
                    "email": True,
                    "workflow": True,
                    "errors": True
                }
            },
            "two_factor": {
                "enabled": False,
                "secret": None,
                "backup_codes": []
            }
        }
        
        result = await users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        print(f"✅ User created: {user_data['email']}")
        return user_doc
        
    except ValueError:
        raise
    except Exception as e:
        print(f"❌ Error creating user: {str(e)}")
        raise RuntimeError(f"Failed to create user: {str(e)}")

async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    try:
        database = get_database()
        users_collection = database.users
        
        user = await users_collection.find_one({"email": email})
        return user
        
    except Exception as e:
        print(f"❌ Error getting user by email: {str(e)}")
        return None

async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    try:
        database = get_database()
        users_collection = database.users
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            user = await users_collection.find_one({"_id": user_id})
        else:
            user = await users_collection.find_one({"_id": ObjectId(user_id)})
            
        return user
        
    except Exception as e:
        print(f"❌ Error getting user by ID: {str(e)}")
        return None

async def update_user(user_id: str, update_data: Dict[str, Any]) -> bool:
    """Update user data"""
    try:
        database = get_database()
        users_collection = database.users
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            query = {"_id": user_id}
        else:
            query = {"_id": ObjectId(user_id)}
        
        update_data["updated_at"] = datetime.utcnow()
        result = await users_collection.update_one(query, {"$set": update_data})
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error updating user: {str(e)}")
        return False

async def update_user_stats(user_id: str, stats: Dict[str, Any]) -> bool:
    """Update user statistics"""
    try:
        database = get_database()
        users_collection = database.users
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            query = {"_id": user_id}
        else:
            query = {"_id": ObjectId(user_id)}
        
        # Build update data with proper dot notation for nested fields
        update_data = {}
        for key, value in stats.items():
            if key in ["workflow_count", "execution_count"]:
                update_data[f"profile.{key}"] = value
            else:
                update_data[key] = value
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await users_collection.update_one(query, {"$set": update_data})
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error updating user stats: {str(e)}")
        return False

async def update_last_login(user_id: str) -> bool:
    """Update user's last login timestamp"""
    try:
        database = get_database()
        users_collection = database.users
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            query = {"_id": user_id}
        else:
            query = {"_id": ObjectId(user_id)}
        
        result = await users_collection.update_one(
            query,
            {"$set": {
                "profile.last_login": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error updating last login: {str(e)}")
        return False

async def deactivate_user(user_id: str) -> bool:
    """Deactivate a user account"""
    try:
        database = get_database()
        users_collection = database.users
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            query = {"_id": user_id}
        else:
            if not ObjectId.is_valid(user_id):
                return False
            query = {"_id": ObjectId(user_id)}
        
        result = await users_collection.update_one(
            query,
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error deactivating user: {str(e)}")
        return False

# Get total number of users
async def get_user_count() -> int:
    """Get total number of users"""
    try:
        database = get_database()
        users_collection = database.users
        count = await users_collection.count_documents({})
        return count
    except Exception as e:
        print(f"❌ Error getting user count: {str(e)}")
        return 0


# Deactivate a user by ID
async def deactivate_user(user_id: str) -> bool:
    """Deactivate a user (set is_active = False)"""
    try:
        database = get_database()
        users_collection = database.users

        query = {"_id": ObjectId(user_id)}
        result = await users_collection.update_one(
            query,
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0

    except Exception as e:
        print(f"❌ Error deactivating user: {str(e)}")
        return False

async def update_last_login(user_id: str) -> bool:
    """Update user's last login timestamp"""
    try:
        database = get_database()
        users_collection = database.users
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            query = {"_id": user_id}
        else:
            if not ObjectId.is_valid(user_id):
                return False
            query = {"_id": ObjectId(user_id)}
        
        result = await users_collection.update_one(
            query,
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
        database = get_database()
        users_collection = database.users
        
        count = await users_collection.count_documents({})
        return count
        
    except Exception as e:
        print(f"❌ Error getting user count: {str(e)}")
        return 0
