from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ValidationError
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv
import os
import json
import re
import asyncio
from urllib.parse import quote_plus

# Load .env from the backend directory regardless of where uvicorn is launched from
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from .models.workflow import Node, Edge, Workflow
from .prompts.workflow_prompt import (
    SYSTEM_PROMPT,
    MODIFY_SYSTEM_PROMPT,
    ALLOWED_GENERATION_NODE_TYPES,
    NODE_DATA_FIELDS,
)
from .models.webhook import WebhookTrigger
from .core.runner import run_workflow_engine
from services.gpt import run_gpt_node
from fastapi.middleware.cors import CORSMiddleware
from services.scheduler import schedule_workflow
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import time
import shutil
from .models.user import UserCreate, UserLogin, User, UserResponse
from .auth.auth import hash_password, verify_password, create_access_token, get_current_user
from .database.connection import connect_to_mongo, close_mongo_connection, db
from .database.user_operations import create_user, get_user_by_email, get_user_by_id, update_user_stats, update_last_login, update_user
from .database.workflow_operations import save_workflow, get_user_workflows, update_workflow, delete_workflow, save_execution_history, get_execution_history
from datetime import datetime, timedelta
import uuid
from .auth.email_service import send_password_reset_email
from services.api_key_manager import get_user_api_manager
from services.gmail_trigger import fetch_latest_email_event
from google_auth_oauthlib.flow import Flow
# Add fallback import for encryption
try:
    from .utils.encryption import encrypt_api_key, decrypt_api_key
except ImportError:
    # Fallback functions if encryption module is not available
    def encrypt_api_key(api_key: str):
        return {"encrypted": api_key, "version": "fallback"}
    
    def decrypt_api_key(encrypted_data):
        if isinstance(encrypted_data, dict):
            return encrypted_data.get("encrypted", "")
        return str(encrypted_data) if encrypted_data else ""

app = FastAPI(title="AutoFlow API", description="Visual Workflow Automation Platform")

# Add event handlers for database connection
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    global listener_event_loop
    try:
        listener_event_loop = asyncio.get_running_loop()

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
    from .auth import hash_password
    
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
                "data": {"label": "GPT Node", "model": "llama-3.3-70b-versatile"},
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
listener_event_loop: Optional[asyncio.AbstractEventLoop] = None

# Store workflows temporarily (in production, use a database)
stored_workflows: Dict[str, Workflow] = {}
gmail_trigger_state: Dict[str, str] = {}
google_oauth_state_store: Dict[str, Dict[str, Any]] = {}

# File directories - Use /tmp for cloud deployment compatibility
BASE_DIR = "/tmp"
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
REPORTS_DIR = os.path.join(BASE_DIR, "generated_reports")
IMAGES_DIR = os.path.join(BASE_DIR, "generated_images")

# Create directories if they don't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

GOOGLE_OAUTH_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
]


def _google_oauth_credentials_path() -> str:
    return os.getenv(
        "GOOGLE_OAUTH_CLIENT_SECRETS_FILE",
        os.path.join(os.path.dirname(__file__), "..", "credentials.json"),
    )


def _google_oauth_redirect_uri() -> str:
    return os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "http://127.0.0.1:8000/api/google/oauth/callback")


def _frontend_base_url() -> str:
    return os.getenv("FRONTEND_BASE_URL", "http://127.0.0.1:3000")


def _build_google_oauth_flow(state: Optional[str] = None) -> Flow:
    return Flow.from_client_secrets_file(
        _google_oauth_credentials_path(),
        scopes=GOOGLE_OAUTH_SCOPES,
        state=state,
        redirect_uri=_google_oauth_redirect_uri(),
    )


def _cleanup_google_oauth_states() -> None:
    now_ts = time.time()
    expired = [
        key for key, value in google_oauth_state_store.items()
        if (now_ts - float(value.get("created_at", 0))) > 600
    ]
    for key in expired:
        google_oauth_state_store.pop(key, None)

# Mount static files to serve uploaded files and generated content
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")


def _validate_workflow_payload(workflow_data: dict) -> Workflow:
    """Validate workflow payload and normalize through Pydantic schema."""
    try:
        if hasattr(Workflow, "model_validate"):
            return Workflow.model_validate(workflow_data)
        return Workflow.parse_obj(workflow_data)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc


def _sanitize_workflow_payload(raw_workflow: dict) -> dict:
    """Normalize potentially noisy React Flow payload to strict workflow schema."""
    raw_nodes = raw_workflow.get("nodes", []) if isinstance(raw_workflow, dict) else []
    raw_edges = raw_workflow.get("edges", []) if isinstance(raw_workflow, dict) else []

    nodes = []
    for node in raw_nodes:
        if not isinstance(node, dict):
            continue
        nodes.append(
            {
                "id": node.get("id"),
                "type": "whatsapp" if node.get("type") in {"twilio", "sms"} else node.get("type"),
                "position": node.get("position"),
                "data": node.get("data") or {},
            }
        )

    edges = []
    for edge in raw_edges:
        if not isinstance(edge, dict):
            continue
        edges.append(
            {
                "id": edge.get("id"),
                "source": edge.get("source"),
                "target": edge.get("target"),
                "type": edge.get("type"),
                "animated": edge.get("animated"),
                "style": edge.get("style"),
                "markerEnd": edge.get("markerEnd"),
            }
        )

    sanitized = {"nodes": nodes, "edges": edges}

    if isinstance(raw_workflow, dict):
        if "name" in raw_workflow:
            sanitized["name"] = raw_workflow.get("name")
        if "workflow_id" in raw_workflow:
            sanitized["workflow_id"] = raw_workflow.get("workflow_id")

    return sanitized


def _extract_json_from_llm_output(raw_output: str) -> dict:
    """Extract JSON object from LLM output text."""
    cleaned = raw_output.strip()

    # First try direct JSON parsing.
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Then try fenced code blocks.
    fenced_match = re.search(r"```(?:json)?\\s*(\{.*\})\\s*```", cleaned, re.DOTALL)
    if fenced_match:
        try:
            return json.loads(fenced_match.group(1))
        except json.JSONDecodeError:
            pass

    # Last resort: parse from first '{' to last '}'.
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        snippet = cleaned[start:end + 1]
        try:
            return json.loads(snippet)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=422, detail=f"Model returned invalid JSON: {str(exc)}") from exc

    raise HTTPException(status_code=422, detail="Model output did not contain a valid JSON object")


def _validate_generated_workflow_rules(workflow: Workflow) -> None:
    """Apply additional strict generation-time business rules."""
    node_ids = {node.id for node in workflow.nodes}

    for node in workflow.nodes:
        if node.type not in ALLOWED_GENERATION_NODE_TYPES:
            raise HTTPException(status_code=422, detail=f"Invalid generated node type: {node.type}")

        if node.position is None:
            raise HTTPException(status_code=422, detail=f"Node '{node.id}' is missing required position")

        allowed_fields = NODE_DATA_FIELDS.get(node.type, set())
        actual_fields = set(node.data.keys())
        if actual_fields - allowed_fields:
            unexpected = sorted(actual_fields - allowed_fields)
            raise HTTPException(
                status_code=422,
                detail=f"Node '{node.id}' has unsupported data fields: {unexpected}",
            )

    for edge in workflow.edges:
        expected_edge_id = f"e_{edge.source}_{edge.target}"
        if edge.id != expected_edge_id:
            raise HTTPException(
                status_code=422,
                detail=f"Edge id must be '{expected_edge_id}' for {edge.source}->{edge.target}",
            )

        if edge.source not in node_ids or edge.target not in node_ids:
            raise HTTPException(
                status_code=422,
                detail=f"Edge {edge.id} references unknown node ids",
            )


class WorkflowGenerateRequest(BaseModel):
    request: Optional[str] = None
    user_request: Optional[str] = None
    model: str = "llama-3.3-70b-versatile"
    max_retries: int = 3


class WorkflowModifyRequest(BaseModel):
    instruction: str
    workflow: dict
    model: str = "llama-3.3-70b-versatile"
    max_retries: int = 3


async def _generate_valid_workflow_with_retries(
    request_text: str,
    model: str,
    max_retries: int,
    system_prompt: str = SYSTEM_PROMPT,
) -> Workflow:
    """Generate a workflow using the LLM with retry on invalid output."""
    attempts = max(1, min(max_retries, 5))
    llm_prompt = f"{system_prompt}\\n\\nUser: {request_text}\\nOutput:"
    last_error = "Unknown generation failure"

    for attempt in range(1, attempts + 1):
        llm_output = await run_gpt_node(llm_prompt, model)

        if isinstance(llm_output, str) and llm_output.startswith("Error:"):
            last_error = llm_output
            continue

        try:
            generated_json = _extract_json_from_llm_output(llm_output)
            workflow = _validate_workflow_payload(generated_json)
            _validate_generated_workflow_rules(workflow)
            return workflow
        except HTTPException as exc:
            last_error = str(exc.detail)
            continue
        except Exception as exc:
            last_error = str(exc)
            continue

    raise HTTPException(
        status_code=422,
        detail=f"Failed to generate valid workflow after {attempts} attempts: {last_error}",
    )


@app.post("/workflows/generate")
async def generate_workflow_from_prompt(
    payload: WorkflowGenerateRequest,
    current_user_id: str = Depends(get_current_user),
):
    """Generate workflow JSON from natural language user request."""
    request_text = (payload.request or payload.user_request or "").strip()
    if not request_text:
        raise HTTPException(status_code=400, detail="request (or user_request) must not be empty")

    workflow = await _generate_valid_workflow_with_retries(
        request_text=request_text,
        model=payload.model,
        max_retries=payload.max_retries,
    )

    return {
        "nodes": [node.dict() for node in workflow.nodes],
        "edges": [edge.dict() for edge in workflow.edges],
        "generated_by": "llm",
        "requested_by": current_user_id,
    }


@app.post("/workflows/modify")
async def modify_workflow_from_prompt(
    payload: WorkflowModifyRequest,
    current_user_id: str = Depends(get_current_user),
):
    """Modify an existing workflow using a natural language instruction."""
    instruction = payload.instruction.strip()
    if not instruction:
        raise HTTPException(status_code=400, detail="instruction must not be empty")

    sanitized_workflow = _sanitize_workflow_payload(payload.workflow)
    existing_workflow = _validate_workflow_payload(sanitized_workflow)
    workflow_json = {
        "nodes": [node.dict() for node in existing_workflow.nodes],
        "edges": [edge.dict() for edge in existing_workflow.edges],
    }

    request_text = (
        f"Current workflow JSON:\n{json.dumps(workflow_json, ensure_ascii=False)}\n\n"
        f"Modification instruction: {instruction}\n"
        "Return the full updated workflow JSON."
    )

    workflow = await _generate_valid_workflow_with_retries(
        request_text=request_text,
        model=payload.model,
        max_retries=payload.max_retries,
        system_prompt=MODIFY_SYSTEM_PROMPT,
    )

    return {
        "nodes": [node.dict() for node in workflow.nodes],
        "edges": [edge.dict() for edge in workflow.edges],
        "generated_by": "llm-modify",
        "requested_by": current_user_id,
    }

def run_scheduled_workflow(workflow_id):
    """Execute a scheduled workflow"""
    print(f"Running scheduled workflow {workflow_id} at {time.strftime('%X')}")
    if workflow_id in stored_workflows:
        import asyncio
        workflow = stored_workflows[workflow_id]
        asyncio.run(run_workflow_engine(workflow.nodes, workflow.edges))


def _gmail_state_key(user_id: str, workflow_id: str, node_id: str) -> str:
    return f"{user_id}:{workflow_id}:{node_id}"


async def _run_gmail_listener_once(workflow_id: str, node_id: str, user_id: str):
    """Poll Gmail for new email and run workflow only on new messages."""
    try:
        workflow = stored_workflows.get(workflow_id)
        if not workflow:
            return

        trigger_node = next((n for n in workflow.nodes if n.id == node_id and n.type == "gmail_trigger"), None)
        if not trigger_node:
            return

        api_manager = await get_user_api_manager(user_id)
        token_json = await api_manager.get_gmail_token_json() if api_manager else None

        # Gmail trigger should listen to the logged-in user's connected mailbox only.
        # Do not fall back to env/file tokens here to avoid cross-account behavior.
        if not token_json:
            print(f"⚠️ Gmail listener skipped for user {user_id}: no user Gmail token connected")
            return

        query = (trigger_node.data or {}).get("query", "")
        label_filter = (trigger_node.data or {}).get("label_filter", "INBOX")

        event = await fetch_latest_email_event(token_json=token_json, query=query, label=label_filter)
        if not event:
            return

        state_key = _gmail_state_key(user_id, workflow_id, node_id)
        latest_message_id = event.get("message_id", "")
        previous_message_id = gmail_trigger_state.get(state_key)

        # Bootstrap state without firing historical emails.
        if not previous_message_id:
            gmail_trigger_state[state_key] = latest_message_id
            print(f"📩 Gmail trigger initialized for {state_key}")
            return

        if previous_message_id == latest_message_id:
            return

        gmail_trigger_state[state_key] = latest_message_id

        flow_payload = {
            "name": workflow.name,
            "workflow_id": workflow.workflow_id,
            "nodes": [n.dict() for n in workflow.nodes],
            "edges": [e.dict() for e in workflow.edges],
        }

        for node in flow_payload["nodes"]:
            if node.get("id") == node_id:
                node.setdefault("data", {})["trigger_payload"] = event
                break

        validated_flow = _validate_workflow_payload(_sanitize_workflow_payload(flow_payload))
        result = await run_workflow_engine(validated_flow.nodes, validated_flow.edges, user_id)
        print(f"✅ Gmail trigger fired workflow {workflow_id}: {result}")

    except Exception as e:
        print(f"❌ Gmail listener error for workflow {workflow_id}: {str(e)}")


def run_gmail_listener_job(workflow_id: str, node_id: str, user_id: str):
    global listener_event_loop

    try:
        if listener_event_loop and listener_event_loop.is_running():
            future = asyncio.run_coroutine_threadsafe(
                _run_gmail_listener_once(workflow_id, node_id, user_id),
                listener_event_loop,
            )
            # Keep timeout under poll interval to avoid overlapping executions.
            future.result(timeout=50)
        else:
            print(
                f"⚠️ Gmail listener loop unavailable for workflow {workflow_id}; "
                "skipping this poll cycle"
            )
    except Exception as e:
        print(f"❌ Gmail listener dispatch error for workflow {workflow_id}: {str(e)}")

@app.post("/workflows/save")
async def save_user_workflow(
    workflow_data: dict, 
    current_user_id: str = Depends(get_current_user)
):
    """Save a workflow to MongoDB"""
    try:
        validated_workflow = _validate_workflow_payload(_sanitize_workflow_payload(workflow_data))
        workflow_name = validated_workflow.name or f"Workflow_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        nodes = [node.dict() for node in validated_workflow.nodes]
        edges = [edge.dict() for edge in validated_workflow.edges]
        
        workflow_id = await save_workflow(current_user_id, workflow_name, nodes, edges)
        
        return {
            "message": "Workflow saved successfully",
            "workflow_id": workflow_id
        }
    except HTTPException:
        raise
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
        validated_workflow = _validate_workflow_payload(_sanitize_workflow_payload(workflow_data))
        nodes = [node.dict() for node in validated_workflow.nodes]
        edges = [edge.dict() for edge in validated_workflow.edges]
        
        success = await update_workflow(workflow_id, nodes, edges)
        
        if success:
            return {"message": "Workflow updated successfully"}
        else:
            return {"error": "Workflow not found or update failed"}
    except HTTPException:
        raise
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
async def run_workflow(flow_data: dict, current_user_id: str = Depends(get_current_user)):
    """Execute workflow with user tracking and history saving"""
    flow = _validate_workflow_payload(_sanitize_workflow_payload(flow_data))
    print(f"Received workflow with {len(flow.nodes)} nodes")
    print(f"Node types: {[node.type for node in flow.nodes]}")
    print(f"Edges: {len(flow.edges)}")
    print(f"User: {current_user_id}")

    has_gmail_trigger = any(node.type == "gmail_trigger" for node in flow.nodes)

    # Check for schedule nodes and register them
    for node in flow.nodes:
        if node.type == "schedule":
            cron_expr = node.data.get("cron", "*/1 * * * *")
            workflow_id = f"scheduled_{node.id}"
            stored_workflows[workflow_id] = flow
            scheduler.add_job(
                run_scheduled_workflow,
                CronTrigger.from_crontab(cron_expr),
                args=[workflow_id],
                id=workflow_id,
                replace_existing=True
            )
        elif node.type == "gmail_trigger":
            workflow_id = flow.workflow_id or f"gmail_{current_user_id}_{node.id}"
            stored_workflows[workflow_id] = flow

            poll_interval = max(1, int(node.data.get("poll_interval", 1)))
            job_id = f"gmail_listener_{workflow_id}_{node.id}"

            scheduler.add_job(
                run_gmail_listener_job,
                "interval",
                minutes=poll_interval,
                args=[workflow_id, node.id, current_user_id],
                id=job_id,
                replace_existing=True,
            )
            print(f"📩 Registered Gmail trigger listener: {job_id} (every {poll_interval} min)")

    # Gmail trigger workflows are event-driven. Register listeners and exit without immediate execution.
    if has_gmail_trigger:
        return {
            "message": "Gmail trigger listener registered and armed",
            "listener_registered": True,
        }

    workflow_name = flow.name or "Unnamed Workflow"
    # If a saved workflow_id was passed, try to resolve its name from DB
    if flow.workflow_id:
        try:
            from .database.connection import get_database as _gdb
            from bson import ObjectId as _ObjId
            _db = _gdb()
            _q = {"_id": flow.workflow_id} if db.in_memory_mode else {"_id": _ObjId(flow.workflow_id)}
            _wf = await _db.workflows.find_one(_q)
            if _wf and _wf.get("name"):
                workflow_name = _wf["name"]
        except Exception:
            pass

    start_time = time.time()
    try:
        result = await run_workflow_engine(flow.nodes, flow.edges, current_user_id)
        print(f"Workflow execution result: {result}")
    except Exception as e:
        print(f"Workflow execution error: {str(e)}")
        result = {"error": f"Workflow execution failed: {str(e)}"}

    duration_ms = int((time.time() - start_time) * 1000)

    # Save execution history
    try:
        nodes_dict = []
        for node in flow.nodes:
            node_dict = {"id": node.id, "type": node.type, "data": node.data}
            if hasattr(node, 'position') and node.position is not None:
                if hasattr(node.position, "model_dump"):
                    node_dict["position"] = node.position.model_dump()
                elif hasattr(node.position, "dict"):
                    node_dict["position"] = node.position.dict()
                else:
                    node_dict["position"] = {
                        "x": getattr(node.position, "x", 0),
                        "y": getattr(node.position, "y", 0),
                    }
            else:
                node_dict["position"] = {"x": 0, "y": 0}
            nodes_dict.append(node_dict)
        edges_dict = [{"id": edge.id, "source": edge.source, "target": edge.target} for edge in flow.edges]
        await save_execution_history(
            current_user_id, flow.workflow_id, nodes_dict, edges_dict, result,
            workflow_name=workflow_name, duration_ms=duration_ms
        )
        print("✅ Execution history saved")
    except Exception as e:
        print(f"Warning: Could not save execution history: {str(e)}")

    # Update user execution count
    try:
        user = await get_user_by_id(current_user_id)
        if user:
            current_count = user.get("profile", {}).get("execution_count", 0)
            await update_user_stats(current_user_id, {"execution_count": current_count + 1})
    except Exception as e:
        print(f"Warning: Could not update user stats: {str(e)}")

    if result.get("error"):
        return {"error": result["error"]}
    return {"message": result}


@app.get("/executions")
async def get_executions(current_user_id: str = Depends(get_current_user)):
    """Get workflow execution history for the current user"""
    try:
        executions = await get_execution_history(current_user_id)
        return executions
    except Exception as e:
        print(f"❌ Get executions error: {str(e)}")
        return []

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


@app.post("/api/google/oauth/start")
async def start_google_oauth(current_user_id: str = Depends(get_current_user)):
    """Generate Google OAuth consent URL for one-click account connection."""
    try:
        credentials_path = _google_oauth_credentials_path()
        if not os.path.exists(credentials_path):
            raise HTTPException(
                status_code=500,
                detail="Google OAuth is not configured on server (credentials.json missing).",
            )

        _cleanup_google_oauth_states()
        flow = _build_google_oauth_flow()
        auth_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
        )

        google_oauth_state_store[state] = {
            "user_id": current_user_id,
            "created_at": time.time(),
        }

        return {"auth_url": auth_url}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Google OAuth start error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start Google OAuth flow")


@app.get("/api/google/oauth/callback")
async def google_oauth_callback(state: Optional[str] = None, code: Optional[str] = None, error: Optional[str] = None):
    """Handle Google OAuth callback and persist token JSON to user's API keys."""
    frontend_base = _frontend_base_url().rstrip("/")

    def _redirect(status: str, message: str = "") -> RedirectResponse:
        target = f"{frontend_base}/settings?google_connect={quote_plus(status)}"
        if message:
            target += f"&message={quote_plus(message)}"
        return RedirectResponse(url=target)

    try:
        if error:
            return _redirect("error", f"Google returned: {error}")

        if not state or not code:
            return _redirect("error", "Missing OAuth state or code")

        state_payload = google_oauth_state_store.pop(state, None)
        if not state_payload:
            return _redirect("error", "OAuth session expired. Please connect again")

        if (time.time() - float(state_payload.get("created_at", 0))) > 600:
            return _redirect("error", "OAuth session timed out. Please connect again")

        user_id = state_payload.get("user_id")
        if not user_id:
            return _redirect("error", "User session missing for OAuth callback")

        flow = _build_google_oauth_flow(state=state)
        flow.fetch_token(code=code)
        creds = flow.credentials

        if not creds or not creds.refresh_token:
            return _redirect("error", "No refresh token received. Reconnect and approve all scopes")

        token_payload = {
            "type": "authorized_user",
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "refresh_token": creds.refresh_token,
            "token_uri": creds.token_uri,
            "scopes": GOOGLE_OAUTH_SCOPES,
        }

        user = await get_user_by_id(user_id)
        if not user:
            return _redirect("error", "User not found while saving Google connection")

        current_api_keys = user.get("api_keys", {})
        token_json_text = json.dumps(token_payload)
        encrypted_token = encrypt_api_key(token_json_text)
        if not encrypted_token:
            return _redirect("error", "Failed to encrypt Google token")

        updated_api_keys = {
            **current_api_keys,
            "google_token_json": encrypted_token,
            # Keep backward compatibility for nodes still reading gmail_token_json.
            "gmail_token_json": encrypted_token,
        }

        success = await update_user(user_id, {"api_keys": updated_api_keys})
        if not success:
            return _redirect("error", "Failed to save Google token")

        return _redirect("success", "Google account connected successfully")
    except Exception as e:
        print(f"❌ Google OAuth callback error: {str(e)}")
        return _redirect("error", "Google connect failed. Please try again")

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
            "openai", "groq", "openrouter", "google", "google_token_json", "discord", "github", 
            "gmail_token_json",
            "whatsapp_token", "whatsapp_phone_number_id", "whatsapp_sender_number", "stability",
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
            "openai", "groq", "openrouter", "google", "google_token_json", "discord", "github", 
            "gmail_token_json",
            "whatsapp_token", "whatsapp_phone_number_id", "whatsapp_sender_number", "stability",
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
        print(f"❌ Decrypt API key error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to decrypt API key")
