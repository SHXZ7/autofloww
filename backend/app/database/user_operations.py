from datetime import datetime
from typing import Optional, Dict, Any
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
# Fix import to use absolute import
from app.database.connection import get_database, db
from app.auth.auth import hash_password

async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new user in MongoDB"""
    try:
        database = get_database()
        users_collection = database.users
        
        # Check if user already exists (important for in-memory DB)
        existing_user = await get_user_by_email(user_data["email"])
        if existing_user:
            raise ValueError("User with this email already exists")
        
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
                "last_login": None,
                "timezone": "UTC-5 (Eastern Time)",
                "notifications": {
                    "email": True,
                    "workflow": True,
                    "errors": True
                }
            }
        }
        
        # Insert user
        result = await users_collection.insert_one(user_doc)
        
        # Return user without password
        # Handle both MongoDB ObjectId and in-memory string ID
        if hasattr(result, "inserted_id"):
            user_doc["_id"] = str(result.inserted_id)
        else:
            # For in-memory DB or other implementations
            user_doc["_id"] = result.inserted_id
            
        user_doc.pop("password")
        
        print(f"✅ User created successfully: {user_data['email']}")
        return user_doc
        
    except ValueError as ve:
        # Re-raise value errors (like duplicate users)
        raise ve
    except RuntimeError as e:
        print(f"❌ Database connection error: {str(e)}")
        raise RuntimeError("Database connection failed. Please check MongoDB connection.")
    except Exception as e:
        print(f"❌ Error creating user: {str(e)}")
        raise

async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    try:
        database = get_database()
        users_collection = database.users
        
        user = await users_collection.find_one({"email": email.lower()})
        
        if user:
            # Handle both MongoDB ObjectId and in-memory string ID
            if isinstance(user.get("_id"), ObjectId):
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
        database = get_database()
        users_collection = database.users
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            # For in-memory database, use string ID directly
            user = await users_collection.find_one({"_id": user_id})
        else:
            # For MongoDB, convert to ObjectId if valid
            if ObjectId.is_valid(user_id):
                user = await users_collection.find_one({"_id": ObjectId(user_id)})
            else:
                return None
        
        if user:
            # Ensure _id is always a string for consistency
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
        database = get_database()
        users_collection = database.users
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            query = {"_id": user_id}
        else:
            if not ObjectId.is_valid(user_id):
                return False
            query = {"_id": ObjectId(user_id)}
        
        result = await users_collection.update_one(
            query,
            {"$set": update_data}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error updating user: {str(e)}")
        return False

async def update_user_stats(user_id: str, workflow_count: int = None, execution_count: int = None):
    """Update user workflow and execution statistics"""
    try:
        database = get_database()
        users_collection = database.users
        
        update_data = {"updated_at": datetime.utcnow()}
        
        if workflow_count is not None:
            update_data["profile.workflow_count"] = workflow_count
            
        if execution_count is not None:
            update_data["profile.execution_count"] = execution_count
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            query = {"_id": user_id}
        else:
            if not ObjectId.is_valid(user_id):
                return False
            query = {"_id": ObjectId(user_id)}
        
        result = await users_collection.update_one(
            query,
            {"$set": update_data}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error updating user stats: {str(e)}")
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
