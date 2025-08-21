import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import asyncio
import certifi
import json
from typing import Dict, Any, Optional

class Database:
    client: AsyncIOMotorClient = None
    database = None
    in_memory_mode: bool = False
    in_memory_data: Dict[str, Dict[str, Any]] = {
        "users": {},
        "workflows": {},
        "workflow_executions": {}
    }

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
        
        # Determine if we should use TLS/SSL based on the connection string
        use_tls = "mongodb+srv" in mongo_url or ".mongodb.net" in mongo_url
        
        # Set connection arguments based on connection type
        connection_args = {
            "serverSelectionTimeoutMS": 5000,  # 5 second timeout
            "connectTimeoutMS": 10000,         # 10 second connection timeout
            "socketTimeoutMS": 20000,          # 20 second socket timeout
            "maxPoolSize": 10,                 # Connection pool size
            "retryWrites": True,               # Enable retry writes
        }
        
        # Only add TLS/SSL settings if we're using an Atlas connection
        if use_tls:
            print("🔒 Using TLS/SSL for MongoDB Atlas connection")
            connection_args.update({
                "tls": True,
                "tlsCAFile": certifi.where(),
            })
        
        # Try to connect to the specified MongoDB URL
        try:
            print(f"🔌 Attempting to connect to: {mongo_url}")
            # Create motor client with proper configuration
            db.client = AsyncIOMotorClient(mongo_url, **connection_args)
            
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
            
        except Exception as e:
            print(f"❌ Failed to connect to {mongo_url}: {str(e)}")
            if "localhost" not in mongo_url.lower():
                print("🔄 Trying local MongoDB connection...")
                return await try_local_connection(db_name)
            else:
                raise
    
    except asyncio.TimeoutError:
        print("❌ MongoDB connection timed out")
        print("💡 Check your connection string and network connectivity")
        
        # Try local connection if not already attempted
        if "localhost" not in str(mongo_url).lower():
            print("🔄 Trying local MongoDB connection...")
            try:
                return await try_local_connection(db_name)
            except Exception:
                # Switch to in-memory mode if local connection fails
                return await use_in_memory_mode()
        else:
            # Switch to in-memory mode
            return await use_in_memory_mode()
        
    except ServerSelectionTimeoutError:
        print("❌ Could not connect to MongoDB server")
        print("💡 Possible issues:")
        print("   - Check if MongoDB is installed and running")
        print("   - Verify MongoDB is listening on port 27017")
        print("   - For Atlas: check if your IP address is whitelisted")
        print("   - Ensure your credentials are correct")
        
        # Try local connection if not already attempted
        if "localhost" not in str(mongo_url).lower():
            print("🔄 Trying local MongoDB connection...")
            try:
                return await try_local_connection(db_name)
            except Exception:
                # Switch to in-memory mode if local connection fails
                return await use_in_memory_mode()
        else:
            # Switch to in-memory mode
            return await use_in_memory_mode()
        
    except ConnectionFailure:
        print("❌ Failed to connect to MongoDB")
        print("💡 Check your MongoDB connection string and credentials")
        
        # Switch to in-memory mode
        return await use_in_memory_mode()
        
    except Exception as e:
        print(f"❌ Database connection error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        
        # Switch to in-memory mode
        return await use_in_memory_mode()

async def try_local_connection(db_name):
    """Attempt to connect to local MongoDB instance"""
    try:
        db.client = AsyncIOMotorClient(
            "mongodb://localhost:27017",
            serverSelectionTimeoutMS=2000,
            connectTimeoutMS=3000
        )
        
        # Test the connection with timeout
        await asyncio.wait_for(
            db.client.admin.command('ping'), 
            timeout=3.0
        )
        
        print("✅ Successfully connected to local MongoDB!")
        
        # Set database
        db.database = db.client[db_name]
        await create_indexes()
        return db.database
    except Exception as local_error:
        print(f"❌ Local MongoDB connection failed: {str(local_error)}")
        # Install instructions for MongoDB
        print("💡 You might need to install MongoDB locally:")
        print("   - Windows: https://www.mongodb.com/try/download/community")
        print("   - Mac: brew install mongodb-community")
        print("   - Linux: sudo apt install -y mongodb")
        # Switch to in-memory mode
        return await use_in_memory_mode()

async def use_in_memory_mode():
    """Switch to in-memory storage mode when MongoDB is unavailable"""
    print("⚠️ Switching to IN-MEMORY MODE")
    print("⚠️ Warning: All data will be lost when the server restarts!")
    db.in_memory_mode = True
    db.client = None
    db.database = InMemoryDatabase()
    return db.database

async def close_mongo_connection():
    """Close database connection"""
    if db.client and not db.in_memory_mode:
        db.client.close()
        print("📝 Disconnected from MongoDB")

async def create_indexes():
    """Create database indexes for better performance"""
    if db.in_memory_mode:
        return
        
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
    if db.in_memory_mode:
        return
        
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
        if db.in_memory_mode:
            return True
            
        if db.client is not None:
            await db.client.admin.command('ping')
            return True
        return False
    except Exception:
        return False

# In-memory database class to use when MongoDB is unavailable
class InMemoryDatabase:
    """Simple in-memory database for development and when MongoDB is unavailable"""
    
    def __init__(self):
        self.collections = {}
        self.id_counters = {}
        print("🧠 In-memory database initialized")
        
    def __getattr__(self, name):
        if name not in self.collections:
            self.collections[name] = InMemoryCollection(name, self)
            self.id_counters[name] = 1
        return self.collections[name]
        
    def get_next_id(self, collection_name):
        """Get next ID for a collection"""
        next_id = self.id_counters[collection_name]
        self.id_counters[collection_name] += 1
        return str(next_id)

class InMemoryCollection:
    """Collection implementation for in-memory database"""
    
    def __init__(self, name, db):
        self.name = name
        self.db = db
        self.data = {}
        
    async def insert_one(self, document):
        """Insert a document into the collection"""
        if "_id" not in document:
            document["_id"] = self.db.get_next_id(self.name)
        self.data[document["_id"]] = document
        return InMemoryInsertResult(document["_id"])
        
    async def find_one(self, query):
        """Find a document matching the query"""
        if "_id" in query:
            doc_id = query["_id"]
            if doc_id in self.data:
                return self.data[doc_id]
            return None
            
        # Simple query support
        for doc in self.data.values():
            matches = True
            for key, value in query.items():
                if key not in doc or doc[key] != value:
                    matches = False
                    break
            if matches:
                return doc
                
        return None
        
    async def find(self, query=None):
        """Find all documents matching the query"""
        if query is None:
            query = {}
        return InMemoryCursor([doc for doc in self.data.values() if self._matches_query(doc, query)])
        
    def _matches_query(self, doc, query):
        """Check if document matches the query"""
        for key, value in query.items():
            if key not in doc or doc[key] != value:
                return False
        return True
        
    async def update_one(self, query, update):
        """Update a document matching the query"""
        doc = await self.find_one(query)
        if not doc:
            return InMemoryUpdateResult(0)
            
        if "$set" in update:
            for key, value in update["$set"].items():
                doc[key] = value
                
        return InMemoryUpdateResult(1)
        
    async def update_many(self, query, update):
        """Update all documents matching the query"""
        count = 0
        for doc in self.data.values():
            if self._matches_query(doc, query):
                if "$set" in update:
                    for key, value in update["$set"].items():
                        doc[key] = value
                count += 1
        return InMemoryUpdateResult(count)
        
    async def delete_one(self, query):
        """Delete a document matching the query"""
        doc = await self.find_one(query)
        if not doc:
            return InMemoryDeleteResult(0)
            
        del self.data[doc["_id"]]
        return InMemoryDeleteResult(1)
        
    async def delete_many(self, query):
        """Delete all documents matching the query"""
        to_delete = []
        for doc_id, doc in self.data.items():
            if self._matches_query(doc, query):
                to_delete.append(doc_id)
                
        for doc_id in to_delete:
            del self.data[doc_id]
            
        return InMemoryDeleteResult(len(to_delete))
        
    async def count_documents(self, query=None):
        """Count documents matching the query"""
        if query is None:
            query = {}
        count = 0
        for doc in self.data.values():
            if self._matches_query(doc, query):
                count += 1
        return count
        
    async def create_index(self, key_or_list, unique=False):
        """Create an index (no-op in memory database)"""
        return key_or_list  # Just return the key, we don't actually create indexes

class InMemoryCursor:
    """Cursor for in-memory database queries"""
    
    def __init__(self, results):
        self.results = results
        self.position = 0
        self._sort_key = None
        self._sort_direction = 1
        
    def __aiter__(self):
        return self
        
    async def __anext__(self):
        if self.position >= len(self.results):
            raise StopAsyncIteration
        result = self.results[self.position]
        self.position += 1
        return result
        
    async def to_list(self, length=None):
        """Convert cursor to a list"""
        if length is None:
            return self.results
        return self.results[:length]
        
    def sort(self, key_or_list, direction=1):
        """Sort results"""
        if isinstance(key_or_list, str):
            self._sort_key = key_or_list
            self._sort_direction = direction
            self.results.sort(
                key=lambda x: x.get(key_or_list, ""), 
                reverse=(direction == -1)
            )
        return self

class InMemoryInsertResult:
    """Result of an insert operation"""
    
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id

class InMemoryUpdateResult:
    """Result of an update operation"""
    
    def __init__(self, modified_count):
        self.modified_count = modified_count
        self.matched_count = modified_count
        self.upserted_id = None

class InMemoryDeleteResult:
    """Result of a delete operation"""
    
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count
