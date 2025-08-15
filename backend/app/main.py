from fastapi import FastAPI, File, UploadFile
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

load_dotenv()

app = FastAPI()

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

@app.post("/run")
async def run_workflow(flow: Workflow):
    print(f"Received workflow with {len(flow.nodes)} nodes")  # Debug log
    print(f"Node types: {[node.type for node in flow.nodes]}")
    print(f"Edges: {len(flow.edges)}")
    
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
async def upload_file(file: UploadFile = File(...)):
    """Upload a file to the server"""
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "filename": file.filename,
            "file_path": file_path,
            "mime_type": file.content_type,
            "size": os.path.getsize(file_path)
        }
    except Exception as e:
        return {"error": f"Failed to upload file: {str(e)}"}

@app.post("/parse-document")
async def parse_document(file: UploadFile = File(...)):
    """Parse uploaded document and return structured data"""
    try:
        # Save uploaded file temporarily
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Import and use document parser
        from services.document_parser import run_document_parser_node
        
        result = await run_document_parser_node({"file_path": file_path})
        
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
