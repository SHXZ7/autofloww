from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict
from dotenv import load_dotenv
from app.models.workflow import Node, Edge, Workflow
from app.models.webhook import WebhookTrigger
from app.core.runner import run_workflow_engine
from fastapi.middleware.cors import CORSMiddleware
from services.scheduler import schedule_workflow
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import time
import os
import shutil
from app.models.user import UserCreate, UserLogin, User, UserResponse
from app.auth.auth import hash_password, verify_password, create_access_token, get_current_user
from app.database.connection import connect_to_mongo, close_mongo_connection, db
from app.database.user_operations import create_user, get_user_by_email, get_user_by_id, update_user_stats, update_last_login, update_user
from app.database.workflow_operations import save_workflow, get_user_workflows, update_workflow, delete_workflow, save_execution_history
from datetime import datetime, timedelta
import uuid
from app.auth.email_service import send_password_reset_email
from app.utils.encryption import encrypt_api_key, decrypt_api_key

load_dotenv()

app = FastAPI(title="AutoFlow API", description="Visual Workflow Automation Platform")

# Add event handlers for database connection
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        # Check if we should force in-memory mode
        if os.getenv("FORCE_IN_MEMORY_DB", "").lower() == "true":
            print("⚠️ FORCE_IN_MEMORY_DB is set to true")
            print("⚠️ Using in-memory database instead of MongoDB")
            from app.database.connection import use_in_memory_mode
            await use_in_memory_mode()
        else:
            await connect_to_mongo()
        
        print("✅ AutoFlow API started successfully")
        
        # Add test data in memory mode
        if db.in_memory_mode:
            await create_test_data()
            
    except Exception as e:
        print(f"⚠️ AutoFlow API started with warnings: {str(e)}")
        print("🔄 The API will continue to run with limited functionality")

async def create_test_data():
    """Create some test data when running in memory mode"""
    from app.auth.auth import hash_password
    
    # Create test user
    test_user = {
        "_id": "1",
        "name": "Test User",
        "email": "test@autoflow.com",
        "password": hash_password("password123"),
        "created_at": datetime.utcnow(),
        "is_active": True,
        "profile": {
            "workspace": "Test Workspace",
            "plan": "Free Plan",
            "workflow_count": 1,
            "execution_count": 5
        }
    }
    
    # Add test user to in-memory database
    await db.database.users.insert_one(test_user)
    
    # Create test workflow
    test_workflow = {
        "_id": "1",
        "user_id": "1",
        "name": "Test Workflow",
        "nodes": [
            {
                "id": "1", 
                "type": "gpt",
                "data": {"label": "GPT Node", "model": "openai/gpt-4o"},
                "position": {"x": 100, "y": 100}
            }
        ],
        "edges": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }
    
    # Add test workflow to in-memory database
    await db.database.workflows.insert_one(test_workflow)
    
    print("🧪 Created test data for in-memory mode")
    print("📝 Test user: test@autoflow.com / password123")

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
        print(f"🗑️ Attempting to delete workflow {workflow_id} for user {current_user_id}")
        
        success = await delete_workflow(workflow_id, current_user_id)
        
        if success:
            # Update user workflow count
            try:
                user = await get_user_by_id(current_user_id)
                if user:
                    current_count = user.get("profile", {}).get("workflow_count", 0)
                    new_count = max(0, current_count - 1)  # Ensure it doesn't go negative
                    await update_user_stats(current_user_id, workflow_count=new_count)
                    print(f"📊 Updated user workflow count to {new_count}")
            except Exception as e:
                print(f"Warning: Could not update user workflow count: {str(e)}")
            
            return {"message": "Workflow deleted successfully"}
        else:
            return {"error": "Workflow not found or you don't have permission to delete it"}
            
    except Exception as e:
        print(f"❌ Delete workflow error: {str(e)}")
        return {"error": f"Failed to delete workflow: {str(e)}"}

# Add endpoint for permanent deletion (admin only or for cleanup)
@app.delete("/workflows/{workflow_id}/permanent")
async def permanently_delete_workflow(
    workflow_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Permanently delete a workflow (hard delete)"""
    try:
        from app.database.workflow_operations import hard_delete_workflow
        
        success = await hard_delete_workflow(workflow_id, current_user_id)
        
        if success:
            return {"message": "Workflow permanently deleted"}
        else:
            return {"error": "Workflow not found or delete failed"}
            
    except Exception as e:
        print(f"❌ Permanent delete workflow error: {str(e)}")
        return {"error": f"Failed to permanently delete workflow: {str(e)}"}

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
        # Fix: Call the correct workflow engine function
        result = await run_workflow_engine(flow.nodes, flow.edges, current_user_id)
        print(f"Workflow execution result: {result}")
        
        # Save execution history
        try:
            # Fix: Handle missing position attribute safely
            nodes_dict = []
            for node in flow.nodes:
                node_dict = {
                    "id": node.id, 
                    "type": node.type, 
                    "data": node.data
                }
                # Only add position if it exists
                if hasattr(node, 'position') and node.position is not None:
                    node_dict["position"] = node.position
                else:
                    node_dict["position"] = {"x": 0, "y": 0}  # Default position
                    
                nodes_dict.append(node_dict)
            
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
                # Fix: Pass stats as dictionary
                await update_user_stats(current_user_id, {"execution_count": current_count + 1})
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
        
        # Return user data (without password) with profile
        user_response = User(
            id=str(user_doc["_id"]),
            name=user_doc["name"],
            email=user_doc["email"],
            created_at=user_doc["created_at"],
            is_active=user_doc["is_active"],
            profile=user_doc.get("profile")
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
            raise HTTPException(status_code=503, detail="Database connection not available")
        
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

        # Update last login
        try:
            await update_last_login(str(user["_id"]))
        except Exception as e:
            print(f"Warning: Could not update last login: {str(e)}")
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user["_id"])})
        
        # Return user data (without password) with profile
        user_response = User(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            created_at=user["created_at"],
            is_active=user["is_active"],
            profile=user.get("profile")
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
            is_active=user["is_active"],
            profile=user.get("profile")
        )
        
        return user_response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get user error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user information")

@app.put("/auth/profile")
async def update_profile(
    profile_data: dict,
    current_user_id: str = Depends(get_current_user)
):
    """Update user profile information"""
    try:
        # Check if database is connected
        if db.database is None:
            raise HTTPException(status_code=503, detail="Database connection not available")
        
        # Get current user
        user = await get_user_by_id(current_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare update data
        update_data = {}
        
        # Update basic user fields
        if "name" in profile_data:
            update_data["name"] = profile_data["name"]
        if "email" in profile_data:
            # Check if email is already taken by another user
            existing_user = await get_user_by_email(profile_data["email"])
            if existing_user and existing_user["_id"] != current_user_id:
                raise HTTPException(status_code=400, detail="Email already taken")
            update_data["email"] = profile_data["email"].lower()
        
        # Update profile fields
        current_profile = user.get("profile", {})
        new_profile = current_profile.copy()
        
        if "workspace" in profile_data:
            new_profile["workspace"] = profile_data["workspace"]
        if "timezone" in profile_data:
            new_profile["timezone"] = profile_data["timezone"]
        if "notifications" in profile_data:
            new_profile["notifications"] = {
                **new_profile.get("notifications", {}),
                **profile_data["notifications"]
            }
        
        update_data["profile"] = new_profile
        
        # Update user in database
        success = await update_user(current_user_id, update_data)
        
        if success:
            # Get updated user data
            updated_user = await get_user_by_id(current_user_id)
            
            # Return updated user data (without password)
            user_response = User(
                id=str(updated_user["_id"]),
                name=updated_user["name"],
                email=updated_user["email"],
                created_at=updated_user["created_at"],
                is_active=updated_user["is_active"],
                profile=updated_user.get("profile")
            )
            
            print(f"✅ Profile updated for user: {updated_user['email']}")
            
            return {
                "message": "Profile updated successfully",
                "user": user_response
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update profile")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Profile update error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@app.put("/auth/password")
async def change_password(
    password_data: dict,
    current_user_id: str = Depends(get_current_user)
):
    """Change user password"""
    try:
        # Check if database is connected
        if db.database is None:
            raise HTTPException(status_code=503, detail="Database connection not available")
        
        # Get current user
        user = await get_user_by_id(current_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        current_password = password_data.get("current_password")
        if not current_password:
            raise HTTPException(status_code=400, detail="Current password is required")
            
        if not verify_password(current_password, user["password"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Check new password
        new_password = password_data.get("new_password")
        if not new_password or len(new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
            
        # Hash new password
        hashed_password = hash_password(new_password)
        
        # Update user password
        success = await update_user(current_user_id, {"password": hashed_password})
        
        if success:
            print(f"✅ Password updated for user: {user['email']}")
            return {"message": "Password updated successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update password")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Password update error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update password: {str(e)}")

@app.post("/auth/forgot-password")
async def forgot_password(request_data: dict):
    """Send password reset email"""
    try:
        email = request_data.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Check if user exists
        user = await get_user_by_email(email)
        if not user:
            # Don't reveal if user exists or not for security
            return {"message": "If an account with that email exists, we've sent a password reset link"}
        
        # Generate reset token
        reset_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
        
        # Store reset token in user document
        await update_user(str(user["_id"]), {
            "password_reset": {
                "token": reset_token,
                "expires_at": expires_at,
                "created_at": datetime.utcnow()
            }
        })
        
        # Send reset email
        email_sent = await send_password_reset_email(
            email=email,
            reset_token=reset_token,
            user_name=user.get("name", "User")
        )
        
        if not email_sent:
            raise HTTPException(status_code=500, detail="Failed to send reset email")
        
        return {"message": "If an account with that email exists, we've sent a password reset link"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Forgot password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process password reset request")
        

@app.get("/auth/validate-reset-token/{token}")
async def validate_reset_token(token: str):
    """Validate if reset token is valid and not expired"""
    try:
        # Find user with this reset token
        if db.in_memory_mode:
            # In-memory search
            for user_data in db.database.collections.get("users", {}).data.values():
                reset_data = user_data.get("password_reset", {})
                if reset_data.get("token") == token:
                    user = user_data
                    break
            else:
                raise HTTPException(status_code=400, detail="Invalid reset token")
        else:
            # MongoDB search
            user = await db.database.users.find_one({
                "password_reset.token": token
            })
            
        if not user:
            raise HTTPException(status_code=400, detail="Invalid reset token")
        
        # Check if token is expired
        reset_data = user.get("password_reset", {})
        expires_at = reset_data.get("expires_at")
        
        if not expires_at or datetime.utcnow() > expires_at:
            raise HTTPException(status_code=400, detail="Reset token has expired")
        
        return {"valid": True, "message": "Token is valid"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Token validation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to validate reset token")

@app.post("/auth/reset-password")
async def reset_password(reset_data: dict):
    """Reset user password using reset token"""
    try:
        token = reset_data.get("token")
        new_password = reset_data.get("new_password")
        
        if not token or not new_password:
            raise HTTPException(status_code=400, detail="Token and new password are required")
        
        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        
        # Find user with this reset token
        if db.in_memory_mode:
            # In-memory search
            user = None
            user_id = None
            for uid, user_data in db.database.collections.get("users", {}).data.items():
                reset_data_stored = user_data.get("password_reset", {})
                if reset_data_stored.get("token") == token:
                    user = user_data
                    user_id = uid
                    break
        else:
            # MongoDB search
            user = await db.database.users.find_one({
                "password_reset.token": token
            })
            user_id = str(user["_id"]) if user else None
            
        if not user:
            raise HTTPException(status_code=400, detail="Invalid reset token")
        
        # Check if token is expired
        reset_data_stored = user.get("password_reset", {})
        expires_at = reset_data_stored.get("expires_at")
        
        if not expires_at or datetime.utcnow() > expires_at:
            raise HTTPException(status_code=400, detail="Reset token has expired")
        
        # Hash new password
        hashed_password = hash_password(new_password)
        
        # Update user password and remove reset token
        update_data = {
            "password": hashed_password,
            "password_reset": None,  # Remove reset token
            "updated_at": datetime.utcnow()
        }
        
        success = await update_user(user_id, update_data)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update password")
        
        return {"message": "Password has been reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Password reset error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

@app.get("/api/user/api-keys")
async def get_user_api_keys(current_user_id: str = Depends(get_current_user)):
    """Get user's API keys (masked for security)"""
    try:
        user = await get_user_by_id(current_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        api_keys_data = user.get("api_keys", {})
        
        # Return masked API keys
        masked_keys = {}
        service_keys = [
            "openai", "openrouter", "google", "discord", "github", 
            "twilio_sid", "twilio_token", "twilio_phone", "stability",
            "twitter_api_key", "twitter_api_secret", "twitter_access_token", 
            "twitter_access_secret", "linkedin_token", "instagram_token"
        ]
        
        for service in service_keys:
            if service in api_keys_data and api_keys_data[service]:
                masked_keys[service] = {
                    "key": "•" * 20,
                    "isActive": True
                }
            else:
                masked_keys[service] = {
                    "key": "",
                    "isActive": False
                }
        
        return {"apiKeys": masked_keys}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get API keys error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get API keys")

@app.put("/api/user/api-keys")
async def update_user_api_keys(
    api_keys_data: dict,
    current_user_id: str = Depends(get_current_user)
):
    """Update user's API keys"""
    try:
        user = await get_user_by_id(current_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        api_keys = api_keys_data.get("apiKeys", {})
        current_api_keys = user.get("api_keys", {})
        updated_api_keys = {}
        
        service_keys = [
            "openai", "openrouter", "google", "discord", "github", 
            "twilio_sid", "twilio_token", "twilio_phone", "stability",
            "twitter_api_key", "twitter_api_secret", "twitter_access_token", 
            "twitter_access_secret", "linkedin_token", "instagram_token"
        ]
        
        for service in service_keys:
            if service in api_keys:
                key_data = api_keys[service]
                new_key = key_data.get("key", "")
                
                # Only update if it's not the masked placeholder
                if new_key and new_key != "•" * 20:
                    encrypted_key = encrypt_api_key(new_key)
                    if encrypted_key:
                        updated_api_keys[service] = encrypted_key
                elif service in current_api_keys:
                    # Keep existing key if masked placeholder is sent
                    updated_api_keys[service] = current_api_keys[service]
        
        # Update user with new API keys
        success = await update_user(current_user_id, {"api_keys": updated_api_keys})
        
        if success:
            # Return masked keys for frontend
            masked_keys = {}
            for service in service_keys:
                if service in updated_api_keys and updated_api_keys[service]:
                    masked_keys[service] = {
                        "key": "•" * 20,
                        "isActive": True
                    }
                else:
                    masked_keys[service] = {
                        "key": "",
                        "isActive": False
                    }
            
            print(f"✅ API keys updated for user: {current_user_id}")
            return {
                "message": "API keys updated successfully",
                "apiKeys": masked_keys
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update API keys")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Update API keys error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update API keys")

@app.get("/api/user/api-keys/decrypt/{service}")
async def get_decrypted_api_key(
    service: str,
    current_user_id: str = Depends(get_current_user)
):
    """Get decrypted API key for internal use (admin/system only)"""
    try:
        user = await get_user_by_id(current_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        api_keys_data = user.get("api_keys", {})
        
        if service not in api_keys_data:
            raise HTTPException(status_code=404, detail=f"{service} API key not found")
        
        encrypted_data = api_keys_data[service]
        decrypted_key = decrypt_api_key(encrypted_data)
        
        if not decrypted_key:
            raise HTTPException(status_code=500, detail="Failed to decrypt API key")
        
        return {"key": decrypted_key}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Decrypt API key error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to decrypt API key")


@app.get("/api/user/api-keys/decrypt/{service}")
async def get_decrypted_api_key(
    service: str,
    current_user_id: str = Depends(get_current_user)
):
    """Get decrypted API key for internal use (admin/system only)"""
    try:
        user = await get_user_by_id(current_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        api_keys_data = user.get("api_keys", {})
        
        if service not in api_keys_data:
            raise HTTPException(status_code=404, detail=f"{service} API key not found")
        
        encrypted_data = api_keys_data[service]
        decrypted_key = decrypt_api_key(encrypted_data)
        
        if not decrypted_key:
            raise HTTPException(status_code=500, detail="Failed to decrypt API key")
        
        return {"key": decrypted_key}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Decrypt API key error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to decrypt API key")
