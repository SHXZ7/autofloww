from datetime import datetime
from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.database.connection import get_database, db

async def save_workflow(user_id: str, workflow_name: str, nodes: List[Dict], edges: List[Dict]) -> str:
    """Save a workflow to MongoDB"""
    try:
        database = get_database()
        workflows_collection = database.workflows
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            user_object_id = user_id
        else:
            user_object_id = ObjectId(user_id)
        
        workflow_doc = {
            "user_id": user_object_id,
            "name": workflow_name,
            "nodes": nodes,
            "edges": edges,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
            "execution_count": 0,
            "last_executed": None
        }
        
        result = await workflows_collection.insert_one(workflow_doc)
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if hasattr(result, "inserted_id"):
            workflow_id = str(result.inserted_id)
        else:
            workflow_id = result.inserted_id
            
        print(f"✅ Workflow saved: {workflow_name} for user {user_id}")
        return workflow_id
        
    except Exception as e:
        print(f"❌ Error saving workflow: {str(e)}")
        raise

async def get_user_workflows(user_id: str) -> List[Dict[str, Any]]:
    """Get all workflows for a user"""
    try:
        database = get_database()
        workflows_collection = database.workflows
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            query = {"user_id": user_id, "is_active": True}
        else:
            query = {"user_id": ObjectId(user_id), "is_active": True}
        
        cursor = workflows_collection.find(query).sort("updated_at", -1)
        
        workflows = []
        async for workflow in cursor:
            # Ensure consistent ID format
            workflow["_id"] = str(workflow["_id"])
            workflow["user_id"] = str(workflow["user_id"])
            workflows.append(workflow)
            
        return workflows
        
    except Exception as e:
        print(f"❌ Error getting user workflows: {str(e)}")
        return []

async def update_workflow(workflow_id: str, nodes: List[Dict], edges: List[Dict]) -> bool:
    """Update an existing workflow"""
    try:
        database = get_database()
        workflows_collection = database.workflows
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            query = {"_id": workflow_id}
        else:
            query = {"_id": ObjectId(workflow_id)}
        
        result = await workflows_collection.update_one(
            query,
            {
                "$set": {
                    "nodes": nodes,
                    "edges": edges,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error updating workflow: {str(e)}")
        return False

async def delete_workflow(workflow_id: str, user_id: str) -> bool:
    """Delete a workflow (soft delete by setting is_active to False)"""
    try:
        database = get_database()
        workflows_collection = database.workflows
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            query = {"_id": workflow_id, "user_id": user_id}
        else:
            if not ObjectId.is_valid(workflow_id):
                print(f"Invalid workflow ID format: {workflow_id}")
                return False
            query = {"_id": ObjectId(workflow_id), "user_id": ObjectId(user_id)}
        
        # Soft delete - set is_active to False
        result = await workflows_collection.update_one(
            query,
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Workflow deleted: {workflow_id} for user {user_id}")
            
            # Also delete any execution history for this workflow
            executions_collection = database.workflow_executions
            if db.in_memory_mode:
                exec_query = {"workflow_id": workflow_id}
            else:
                exec_query = {"workflow_id": ObjectId(workflow_id)}
                
            await executions_collection.update_many(
                exec_query,
                {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
            )
            
            return True
        else:
            print(f"❌ No workflow found to delete: {workflow_id} for user {user_id}")
            return False
        
    except Exception as e:
        print(f"❌ Error deleting workflow: {str(e)}")
        return False

async def hard_delete_workflow(workflow_id: str, user_id: str) -> bool:
    """Permanently delete a workflow and its execution history"""
    try:
        database = get_database()
        workflows_collection = database.workflows
        executions_collection = database.workflow_executions
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            workflow_query = {"_id": workflow_id, "user_id": user_id}
            exec_query = {"workflow_id": workflow_id}
        else:
            if not ObjectId.is_valid(workflow_id):
                return False
            workflow_query = {"_id": ObjectId(workflow_id), "user_id": ObjectId(user_id)}
            exec_query = {"workflow_id": ObjectId(workflow_id)}
        
        # Delete workflow
        workflow_result = await workflows_collection.delete_one(workflow_query)
        
        # Delete execution history
        execution_result = await executions_collection.delete_many(exec_query)
        
        if workflow_result.deleted_count > 0:
            print(f"✅ Workflow permanently deleted: {workflow_id} (executions: {execution_result.deleted_count})")
            return True
        else:
            return False
        
    except Exception as e:
        print(f"❌ Error permanently deleting workflow: {str(e)}")
        return False

async def save_execution_history(user_id: str, workflow_id: str, nodes: List[Dict], edges: List[Dict], result: Dict) -> str:
    """Save workflow execution history"""
    try:
        database = get_database()
        executions_collection = database.workflow_executions
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if db.in_memory_mode:
            user_object_id = user_id
            workflow_object_id = workflow_id if workflow_id else None
        else:
            user_object_id = ObjectId(user_id)
            workflow_object_id = ObjectId(workflow_id) if workflow_id else None
        
        execution_doc = {
            "user_id": user_object_id,
            "workflow_id": workflow_object_id,
            "nodes": nodes,
            "edges": edges,
            "result": result,
            "executed_at": datetime.utcnow(),
            "status": "success" if not result.get("error") else "failed"
        }
        
        result = await executions_collection.insert_one(execution_doc)
        
        # Handle both MongoDB ObjectId and in-memory string ID
        if hasattr(result, "inserted_id"):
            execution_id = str(result.inserted_id)
        else:
            execution_id = result.inserted_id
            
        return execution_id
        
    except Exception as e:
        print(f"❌ Error saving execution history: {str(e)}")
        raise
