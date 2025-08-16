from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict
from dotenv import load_dotenv
from .models.workflow import Node, Edge, Workflow
from .models.webhook import WebhookTrigger
from .core.runner import run_workflow_engine
from fastapi.middleware.cors import CORSMiddleware
from services.scheduler import schedule_workflow
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import time
import os
import shutil
from .models.user import UserCreate, UserLogin, User, UserResponse
from .auth.auth import hash_password, verify_password, create_access_token, get_current_user
from .database.connection import connect_to_mongo, close_mongo_connection, db
from .database.user_operations import create_user, get_user_by_email, get_user_by_id, update_user_stats
from .database.workflow_operations import save_workflow, get_user_workflows, update_workflow, delete_workflow, save_execution_history
from datetime import datetime
import uuid

load_dotenv()

app = FastAPI(title="AutoFlow API", description="Visual Workflow Automation Platform")

# Add event handlers for database connection
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        await connect_to_mongo()
        print("✅ AutoFlow API started successfully")
    except Exception as e:
        print(f"❌ Failed to start AutoFlow API: {str(e)}")
        # Don't exit, but log the error

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await close_mongo_connection()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = BackgroundScheduler()
scheduler.start()

# Store workflows temporarily (in production, use a database)
stored_workflows: Dict[str, Workflow] = {}

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
REPORTS_DIR = "generated_reports"
IMAGES_DIR = "generated_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

# Mount static files to serve uploaded files and generated content
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

def run_scheduled_workflow(workflow_id):
    """Execute a scheduled workflow"""
    print(f"Running scheduled workflow {workflow_id} at {time.strftime('%X')}")
    if workflow_id in stored_workflows:
        import asyncio
        workflow = stored_workflows[workflow_id]
        asyncio.run(run_workflow_engine(workflow.nodes, workflow.edges))

@app.post("/workflows/save")
async def save_user_workflow(
    workflow_data: dict, 
    current_user_id: str = Depends(get_current_user)
):
    """Save a workflow to MongoDB"""
    try:
        workflow_name = workflow_data.get("name", f"Workflow_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        nodes = workflow_data.get("nodes", [])
        edges = workflow_data.get("edges", [])
        
        workflow_id = await save_workflow(current_user_id, workflow_name, nodes, edges)
        
        return {
            "message": "Workflow saved successfully",
            "workflow_id": workflow_id
        }
        
    except Exception as e:
        print(f"❌ Save workflow error: {str(e)}")
        return {"error": f"Failed to save workflow: {str(e)}"}

@app.get("/workflows")
async def get_workflows(current_user_id: str = Depends(get_current_user)):
    """Get all workflows for the current user"""
    try:
        workflows = await get_user_workflows(current_user_id)
        return {"workflows": workflows}
        
    except Exception as e:
        print(f"❌ Get workflows error: {str(e)}")
        return {"error": f"Failed to get workflows: {str(e)}"}

@app.put("/workflows/{workflow_id}")
async def update_user_workflow(
    workflow_id: str,
    workflow_data: dict,
    current_user_id: str = Depends(get_current_user)
):
    """Update an existing workflow"""
    try:
        nodes = workflow_data.get("nodes", [])
        edges = workflow_data.get("edges", [])
        
        success = await update_workflow(workflow_id, nodes, edges)
        
        if success:
            return {"message": "Workflow updated successfully"}
        else:
            return {"error": "Workflow not found or update failed"}
            
    except Exception as e:
        print(f"❌ Update workflow error: {str(e)}")
        return {"error": f"Failed to update workflow: {str(e)}"}

@app.delete("/workflows/{workflow_id}")
async def delete_user_workflow(
    workflow_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Delete a workflow"""
    try:
        success = await delete_workflow(workflow_id, current_user_id)
        
        if success:
            return {"message": "Workflow deleted successfully"}
        else:
            return {"error": "Workflow not found or delete failed"}
            
    except Exception as e:
        print(f"❌ Delete workflow error: {str(e)}")
        return {"error": f"Failed to delete workflow: {str(e)}"}

@app.post("/run")
async def run_workflow(flow: Workflow, current_user_id: str = Depends(get_current_user)):
    """Execute workflow with user tracking and history saving"""
    print(f"Received workflow with {len(flow.nodes)} nodes")
    print(f"Node types: {[node.type for node in flow.nodes]}")
    print(f"Edges: {len(flow.edges)}")
    print(f"User: {current_user_id}")
    
    # Check for schedule nodes and register them
    for node in flow.nodes:
        if node.type == "schedule":
            cron_expr = node.data.get("cron", "*/1 * * * *")
            workflow_id = f"scheduled_{node.id}"
            stored_workflows[workflow_id] = flow
            
            # Add the scheduled job
            scheduler.add_job(
                run_scheduled_workflow,
                CronTrigger.from_crontab(cron_expr),
                args=[workflow_id],
                id=workflow_id,
                replace_existing=True
            )
    
    try:
        result = await run_workflow_engine(flow.nodes, flow.edges)
        print(f"Workflow execution result: {result}")
        
        # Save execution history
        try:
            nodes_dict = [{"id": node.id, "type": node.type, "data": node.data, "position": node.position} for node in flow.nodes]
            edges_dict = [{"id": edge.id, "source": edge.source, "target": edge.target} for edge in flow.edges]
            
            await save_execution_history(current_user_id, None, nodes_dict, edges_dict, result)
            print("✅ Execution history saved")
        except Exception as e:
            print(f"Warning: Could not save execution history: {str(e)}")
        
        # Update user execution count
        try:
            user = await get_user_by_id(current_user_id)
            if user:
                current_count = user.get("profile", {}).get("execution_count", 0)
                await update_user_stats(current_user_id, execution_count=current_count + 1)
        except Exception as e:
            print(f"Warning: Could not update user stats: {str(e)}")
        
        return {"message": result}
    except Exception as e:
        print(f"Workflow execution error: {str(e)}")
        return {"error": f"Workflow execution failed: {str(e)}"}

@app.post("/webhook/register/{workflow_id}")
async def register_webhook_workflow(workflow_id: str, flow: Workflow):
    """Register a workflow to be triggered by webhooks"""
    stored_workflows[workflow_id] = flow
    webhook_url = f"http://localhost:8000/webhook/trigger/{workflow_id}"
    return {
        "message": f"Workflow {workflow_id} registered for webhook triggers",
        "webhook_url": webhook_url
    }

@app.post("/webhook/trigger/{workflow_id}")
async def trigger_webhook_workflow(workflow_id: str, webhook_data: WebhookTrigger):
    """Trigger a registered workflow via webhook"""
    if workflow_id not in stored_workflows:
        return {"error": f"Workflow {workflow_id} not found"}
    
    workflow = stored_workflows[workflow_id]
    
    # Inject webhook payload into webhook nodes
    updated_nodes = []
    for node in workflow.nodes:
        if node.type == "webhook":
            # Inject the webhook payload into webhook nodes
            node.data["webhook_payload"] = webhook_data.payload
            node.data["webhook_source"] = webhook_data.source
        updated_nodes.append(node)
    
    # Execute the workflow with webhook data
    result = await run_workflow_engine(updated_nodes, workflow.edges)
    return {
        "message": "Webhook workflow executed successfully",
        "result": result
    }

@app.get("/webhook/list")
async def list_registered_workflows():
    """List all registered webhook workflows"""
    return {
        "workflows": list(stored_workflows.keys()),
        "count": len(stored_workflows)
    }

@app.post("/schedule")
async def add_schedule(workflow_id: str, cron: str):
    if workflow_id in stored_workflows:
        scheduler.add_job(
            run_scheduled_workflow,
            CronTrigger.from_crontab(cron),
            args=[workflow_id],
            id=workflow_id,
            replace_existing=True
        )
        return {"message": f"Workflow {workflow_id} scheduled with cron {cron}"}
    return {"error": f"Workflow {workflow_id} not found"}

@app.post("/schedule/stop/{workflow_id}")
async def stop_schedule(workflow_id: str):
    """Stop a scheduled workflow"""
    try:
        # Check if job exists first
        job = scheduler.get_job(workflow_id)
        if not job:
            return {"error": f"No scheduled job found with ID: {workflow_id}"}
        
        scheduler.remove_job(workflow_id)
        print(f"Successfully stopped scheduled workflow: {workflow_id}")
        return {"message": f"Scheduled workflow {workflow_id} stopped successfully"}
    except Exception as e:
        print(f"Error stopping workflow {workflow_id}: {str(e)}")
        return {"error": f"Failed to stop workflow {workflow_id}: {str(e)}"}

@app.get("/schedule/list")
async def list_scheduled_workflows():
    """List all active scheduled workflows"""
    jobs = scheduler.get_jobs()
    scheduled_workflows = []
    for job in jobs:
        scheduled_workflows.append({
            "workflow_id": job.id,
            "next_run": str(job.next_run_time),
            "trigger": str(job.trigger)
        })
    return {"scheduled_workflows": scheduled_workflows, "count": len(scheduled_workflows)}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user_id: str = Depends(get_current_user)):
    """Upload a file to the server"""
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"📁 File uploaded by user {current_user_id}: {file.filename}")
        
        return {
            "filename": file.filename,
            "file_path": file_path,
            "mime_type": file.content_type,
            "size": os.path.getsize(file_path)
        }
    except Exception as e:
        return {"error": f"Failed to upload file: {str(e)}"}

@app.post("/parse-document")
async def parse_document(file: UploadFile = File(...), current_user_id: str = Depends(get_current_user)):
    """Parse uploaded document and return structured data"""
    try:
        # Save uploaded file temporarily
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Import and use document parser
        from services.document_parser import run_document_parser_node
        
        result = await run_document_parser_node({"file_path": file_path})
        
        print(f"📄 Document parsed by user {current_user_id}: {file.filename}")
        
        return {
            "filename": file.filename,
            "file_path": file_path,
            "result": result
        }
    except Exception as e:
        return {"error": f"Failed to parse document: {str(e)}"}

@app.post("/generate-report")
async def generate_report_endpoint(report_data: dict):
    """Generate a report from provided data"""
    try:
        from services.report_generator import run_report_generator_node
        result = await run_report_generator_node(report_data)
        return {"message": result}
    except Exception as e:
        return {"error": f"Report generation failed: {str(e)}"}

@app.post("/auth/signup")
async def signup(user_data: UserCreate):
    """Register a new user"""
    try:
        # Check if database is connected
        if db.database is None:
            return {"error": "Database connection not available. Please try again later."}
            
        # Create user in MongoDB
        user_doc = await create_user({
            "name": user_data.name,
            "email": user_data.email,
            "password": user_data.password
        })
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user_doc["_id"])})
        
        # Return user data (without password)
        user_response = User(
            id=str(user_doc["_id"]),
            name=user_doc["name"],
            email=user_doc["email"],
            created_at=user_doc["created_at"],
            is_active=user_doc["is_active"]
        )
        
        print(f"✅ New user registered: {user_data.email}")
        
        return {
            "user": user_response,
            "token": access_token
        }
        
    except ValueError as e:
        return {"error": str(e)}
    except RuntimeError as e:
        print(f"❌ Database error during signup: {str(e)}")
        return {"error": "Database connection error. Please try again later."}
    except Exception as e:
        print(f"❌ Signup error: {str(e)}")
        return {"error": f"Signup failed: {str(e)}"}

@app.post("/auth/login")
async def login(user_data: UserLogin):
    """Authenticate user and return token"""
    try:
        # Check if database is connected
        if db.database is None:
            return {"error": "Database connection not available. Please try again later."}
            
        # Find user by email in MongoDB
        user = await get_user_by_email(user_data.email)
        
        if not user:
            return {"error": "Invalid email or password"}
        
        # Verify password
        if not verify_password(user_data.password, user["password"]):
            return {"error": "Invalid email or password"}
        
        # Check if user is active
        if not user.get("is_active", True):
            return {"error": "Account is disabled"}
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user["_id"])})
        
        # Return user data (without password)
        user_response = User(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            created_at=user["created_at"],
            is_active=user["is_active"]
        )
        
        print(f"✅ User logged in: {user_data.email}")
        
        return {
            "user": user_response,
            "token": access_token
        }
        
    except RuntimeError as e:
        print(f"❌ Database error during login: {str(e)}")
        return {"error": "Database connection error. Please try again later."}
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return {"error": f"Login failed: {str(e)}"}

@app.get("/auth/me")
async def get_current_user_info(current_user_id: str = Depends(get_current_user)):
    """Get current user information"""
    try:
        # Check if database is connected
        if db.database is None:
            raise HTTPException(status_code=503, detail="Database connection not available")
            
        user = await get_user_by_id(current_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_response = User(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            created_at=user["created_at"],
            is_active=user["is_active"]
        )
        
        return user_response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get user error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user information")
