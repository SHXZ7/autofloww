from datetime import datetime
from typing import Optional, Dict, Any, List
from bson import ObjectId
from .connection import get_database

async def save_workflow(user_id: str, workflow_name: str, nodes: List[Dict], edges: List[Dict]) -> str:
    """Save a workflow to MongoDB"""
    try:
        db = get_database()
        workflows_collection = db.workflows
        
        workflow_doc = {
            "user_id": ObjectId(user_id),
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
        print(f"✅ Workflow saved: {workflow_name} for user {user_id}")
        return str(result.inserted_id)
        
    except Exception as e:
        print(f"❌ Error saving workflow: {str(e)}")
        raise

async def get_user_workflows(user_id: str) -> List[Dict[str, Any]]:
    """Get all workflows for a user"""
    try:
        db = get_database()
        workflows_collection = db.workflows
        
        cursor = workflows_collection.find(
            {"user_id": ObjectId(user_id), "is_active": True}
        ).sort("updated_at", -1)
        
        workflows = []
        async for workflow in cursor:
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
        db = get_database()
        workflows_collection = db.workflows
        
        result = await workflows_collection.update_one(
            {"_id": ObjectId(workflow_id)},
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
    """Delete a workflow"""
    try:
        db = get_database()
        workflows_collection = db.workflows
        
        result = await workflows_collection.update_one(
            {"_id": ObjectId(workflow_id), "user_id": ObjectId(user_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error deleting workflow: {str(e)}")
        return False

async def save_execution_history(user_id: str, workflow_id: str, nodes: List[Dict], edges: List[Dict], result: Dict) -> str:
    """Save workflow execution history"""
    try:
        db = get_database()
        executions_collection = db.workflow_executions
        
        execution_doc = {
            "user_id": ObjectId(user_id),
            "workflow_id": ObjectId(workflow_id) if workflow_id else None,
            "nodes": nodes,
            "edges": edges,
            "result": result,
            "executed_at": datetime.utcnow(),
            "status": "success" if not result.get("error") else "failed"
        }
        
        result = await executions_collection.insert_one(execution_doc)
        return str(result.inserted_id)
        
    except Exception as e:
        print(f"❌ Error saving execution history: {str(e)}")
        raise
