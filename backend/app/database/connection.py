import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import asyncio

class Database:
    client: AsyncIOMotorClient = None
    database = None

# Global database instance
db = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        # Get MongoDB connection string from environment
        mongo_url = os.getenv("MONGODB_URL")
        db_name = os.getenv("DATABASE_NAME", "autoflow")
        
        if not mongo_url:
            print("⚠️ Warning: MONGODB_URL not found in environment variables")
            print("Using fallback connection string...")
            mongo_url = "mongodb://localhost:27017"
        
        print(f"🔌 Connecting to MongoDB...")
        print(f"Database: {db_name}")
        
        # Create motor client with proper configuration for Atlas
        db.client = AsyncIOMotorClient(
            mongo_url,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            connectTimeoutMS=10000,         # 10 second connection timeout
            socketTimeoutMS=20000,          # 20 second socket timeout
            maxPoolSize=10,                 # Connection pool size
            retryWrites=True,               # Enable retry writes
            w='majority'                    # Write concern
        )
        
        # Test the connection with timeout
        await asyncio.wait_for(
            db.client.admin.command('ping'), 
            timeout=10.0
        )
        
        print("✅ Successfully connected to MongoDB!")
        
        # Set database
        db.database = db.client[db_name]
        
        # Create indexes for better performance
        await create_indexes()
        
        # Test database operations
        await test_database_operations()
        
        return db.database
        
    except asyncio.TimeoutError:
        print("❌ MongoDB connection timed out")
        print("💡 Check your connection string and network connectivity")
        raise
    except ServerSelectionTimeoutError:
        print("❌ Could not connect to MongoDB server")
        print("💡 Possible issues:")
        print("   - Check if MongoDB Atlas cluster is running")
        print("   - Verify your IP address is whitelisted")
        print("   - Check your connection string")
        print("   - Ensure your credentials are correct")
        raise
    except ConnectionFailure:
        print("❌ Failed to connect to MongoDB")
        print("💡 Check your MongoDB connection string and credentials")
        raise
    except Exception as e:
        print(f"❌ Database connection error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("📝 Disconnected from MongoDB")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        users_collection = db.database.users
        
        # Create unique index on email
        await users_collection.create_index("email", unique=True)
        
        # Create index on created_at for sorting
        await users_collection.create_index("created_at")
        
        # Create index on is_active for filtering
        await users_collection.create_index("is_active")
        
        print("📊 Database indexes created successfully")
        
    except Exception as e:
        print(f"⚠️ Warning: Could not create indexes: {str(e)}")

async def test_database_operations():
    """Test basic database operations"""
    try:
        # Test write operation
        test_collection = db.database.test
        test_doc = {"test": True, "timestamp": "2024-01-01"}
        
        # Insert test document
        result = await test_collection.insert_one(test_doc)
        
        # Read test document
        found_doc = await test_collection.find_one({"_id": result.inserted_id})
        
        # Delete test document
        await test_collection.delete_one({"_id": result.inserted_id})
        
        if found_doc:
            print("✅ Database operations test passed")
        else:
            print("⚠️ Database read test failed")
            
    except Exception as e:
        print(f"⚠️ Database operations test failed: {str(e)}")

def get_database():
    """Get database instance"""
    if db.database is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return db.database

async def check_connection():
    """Check if database connection is alive"""
    try:
        if db.client is not None:
            await db.client.admin.command('ping')
            return True
        return False
    except Exception:
        return False
