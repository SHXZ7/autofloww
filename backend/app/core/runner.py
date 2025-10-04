# backend/app/core/runner.py

import networkx as nx
import sys
import os
import json
import atexit
import asyncio
import time
from urllib.parse import urlparse
from typing import List, Dict, Any, Optional, Union

from datetime import datetime
from dataclasses import dataclass
from abc import ABC, abstractmethod

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from apscheduler.schedulers.background import BackgroundScheduler

# Import models - FIXED: Use relative imports
from ..models.workflow import Node, Edge, Workflow

# Import services
from services.gpt import run_gpt_node
from services.email import run_email_node
from services.webhook import run_webhook_node
from services.twilio_node import run_twilio_node
from services.googlesheets import write_to_sheet
from services.file_upload import upload_to_drive, download_from_drive
from services.image_generation import run_image_generation_node
from services.discord import run_discord_node
from services.report_generator import run_report_generator_node
from services.social_media import run_social_media_node

# Fix the import path for API manager with better error handling
try:
    from services.api_key_manager import get_user_api_manager
except ImportError as e:
    print(f"⚠️ Warning: Could not import API key manager: {str(e)}")
    # Fallback for deployment contexts
    async def get_user_api_manager(user_id: str):
        print(f"⚠️ Using fallback API manager for user {user_id}")
        return None

# Import database operations - FIXED: Use relative imports with error handling
try:
    from ..database.user_operations import get_user_by_id, update_user_stats
    from ..database.workflow_operations import save_execution_history
except ImportError as e:
    print(f"⚠️ Warning: Could not import database operations: {str(e)}")
    # Create fallback functions
    async def get_user_by_id(user_id: str):
        return None
    
    async def update_user_stats(user_id: str, stats: dict):
        return False
    
    async def save_execution_history(user_id: str, workflow_id: str, nodes: list, edges: list, result: dict):
        return "fallback_execution_id"

@dataclass
class NodeExecutionContext:
    """Context for node execution containing all necessary data."""
    node: Node
    input_data: Dict[str, Any]
    api_manager: Optional[Any]
    user_id: Optional[str] = None


@dataclass
class ExecutionResult:
    """Result of node execution."""
    success: bool
    data: Any
    error_message: Optional[str] = None


class WorkflowScheduler:
    """Handles workflow scheduling operations."""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()
        atexit.register(lambda: self.scheduler.shutdown())
    
    def schedule_task(self, cron_expr: str, workflow: Dict[str, Any]) -> None:
        """Schedule a workflow task with cron expression."""
        self.scheduler.add_job(
            lambda: self._run_workflow_sync(workflow),
            trigger="cron",
            **self._parse_cron_expr(cron_expr)
        )
    
    def _parse_cron_expr(self, expr: str) -> Dict[str, str]:
        """Parse cron expression into scheduler parameters."""
        fields = expr.split()
        if len(fields) != 5:
            raise ValueError(f"Invalid cron expression: {expr}")
        
        return {
            "minute": fields[0],
            "hour": fields[1],
            "day": fields[2],
            "month": fields[3],
            "day_of_week": fields[4],
        }
    
    def _run_workflow_sync(self, workflow: Dict[str, Any]) -> Any:
        """Synchronous wrapper for workflow execution."""
        import asyncio
        return asyncio.run(run_workflow_engine(workflow["nodes"], workflow["edges"]))


class ContentProcessor:
    """Handles processing of content between workflow nodes."""
    
    @staticmethod
    def extract_file_attachments(input_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract file attachments from input data."""
        attachments = []
        
        for pred_id, pred_result in input_data.items():
            if not pred_result or not isinstance(pred_result, str):
                continue
                
            # Handle different types of file results
            if "Document parsed:" in pred_result:
                json_path = pred_result.split("Document parsed: ")[-1]
                if os.path.exists(json_path):
                    attachments.append({
                        "path": json_path,
                        "name": "parsed_document.json",
                        "type": "file"
                    })
            
            elif "Report generated:" in pred_result:
                report_path = pred_result.split("Report generated: ")[-1]
                if os.path.exists(report_path):
                    attachments.append({
                        "path": report_path,
                        "name": os.path.basename(report_path),
                        "type": "file"
                    })
            
            elif "Image generated:" in pred_result:
                image_path = ContentProcessor._find_image_path(pred_result)
                if image_path:
                    attachments.append({
                        "path": image_path,
                        "name": os.path.basename(image_path),
                        "type": "file"
                    })
            
            elif "File uploaded:" in pred_result:
                file_url = pred_result.split("File uploaded: ")[-1]
                attachments.append({
                    "url": file_url,
                    "name": "uploaded_file",
                    "type": "url"
                })
        
        return attachments
    
    @staticmethod
    def _find_image_path(pred_result: str) -> Optional[str]:
        """Find and validate image path from generation result."""
        image_path = pred_result.split("Image generated: ")[-1].strip()
        
        image_path = os.path.normpath(image_path)
        if os.path.exists(image_path):
            return os.path.abspath(image_path)
        
        alternative_paths = [
        os.path.abspath(image_path),
        os.path.join(os.getcwd(), image_path),
        os.path.join(os.getcwd(), os.path.basename(image_path)),
        ]

        for alt_path in alternative_paths:
            normalized_path = os.path.normpath(alt_path)
            if os.path.exists(normalized_path):
                return normalized_path
        
            print(f"Image path not found: {image_path}")
            print(f"Tried paths: {alternative_paths}")
            return None
        
    @staticmethod
    def extract_ai_content(input_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract AI-generated content from input data."""
        ai_content = []
        
        for pred_id, pred_result in input_data.items():
            if not ContentProcessor._is_ai_content(pred_result):
                continue
            
            ai_model = ContentProcessor._determine_ai_model(pred_id)
            ai_content.append({
                "model": ai_model,
                "content": pred_result,
                "source_id": pred_id
            })
        
        return ai_content
    
    @staticmethod
    def _is_ai_content(pred_result: Any) -> bool:
        """Check if result is AI-generated content."""
        if not isinstance(pred_result, str) or len(pred_result.strip()) <= 10:
            return False
        
        excluded_terms = [
            "failed", "error", "not implemented", "sent successfully", 
            "uploaded", "generated:", "deleted", "saved", "webhook", 
            "document parsed:"
        ]
        
        return not any(term in pred_result.lower() for term in excluded_terms)
    
    @staticmethod
    def _determine_ai_model(pred_id: str) -> str:
        """Determine AI model type from predecessor ID."""
        pred_id_lower = str(pred_id).lower()
        
        if "gpt" in pred_id_lower:
            return "GPT"
        elif "claude" in pred_id_lower:
            return "Claude"
        elif "gemini" in pred_id_lower:
            return "Gemini"
        elif "llama" in pred_id_lower:
            return "Llama"
        elif "mistral" in pred_id_lower:
            return "Mistral"
        
        return "AI Assistant"


class BaseNodeExecutor(ABC):
    """Base class for node executors."""
    
    @abstractmethod
    async def execute(self, context: NodeExecutionContext) -> ExecutionResult:
        """Execute the node with given context."""
        pass
    
    def _setup_api_keys(self, context: NodeExecutionContext, required_keys: List[str]) -> None:
        """Setup API keys from the API manager."""
        if not context.api_manager:
            return
        
        # Implementation would depend on specific API key requirements
        pass


class AINodeExecutor(BaseNodeExecutor):
    """Executor for AI nodes (GPT, Claude, Gemini, etc.)."""
    
    async def execute(self, context: NodeExecutionContext) -> ExecutionResult:
        try:
            await self._setup_ai_api_keys(context)
            
            prompt = self._build_prompt(context)
            if not prompt:
                return ExecutionResult(False, None, f"No prompt provided for {context.node.type} node")
            
            model = context.node.data.get("model", "meta-llama/llama-3-8b-instruct")
            result = await run_gpt_node(prompt, model)
            
            return ExecutionResult(True, result)
            
        except Exception as e:
            return ExecutionResult(False, None, f"Error executing {context.node.type} node: {str(e)}")
    
    async def _setup_ai_api_keys(self, context: NodeExecutionContext) -> None:
        """Setup API keys for AI models."""
        if not context.api_manager:
            return
        
        node_type = context.node.type
        model = context.node.data.get("model", "")
        
        if node_type == "gpt" or model.startswith("openai"):
            api_key = await context.api_manager.get_openai_key()
            if api_key:
                os.environ["OPENAI_API_KEY"] = api_key
        else:
            api_key = await context.api_manager.get_openrouter_key()
            if api_key:
                os.environ["OPENROUTER_API_KEY"] = api_key
    
    def _build_prompt(self, context: NodeExecutionContext) -> str:
        """Build prompt from node data and input context."""
        prompt = context.node.data.get("prompt") or context.node.data.get("label", "")
        
        # Check for parsed document content
        for pred_id, pred_result in context.input_data.items():
            if "Document parsed:" in str(pred_result):
                enhanced_prompt = self._enhance_prompt_with_document(prompt, pred_result)
                if enhanced_prompt:
                    return enhanced_prompt
        
        return prompt
    
    def _enhance_prompt_with_document(self, prompt: str, pred_result: str) -> Optional[str]:
        """Enhance prompt with document content."""
        try:
            json_path = str(pred_result).split("Document parsed: ")[-1]
            with open(json_path, 'r', encoding='utf-8') as f:
                parsed_data = json.load(f)
            
            document_content = parsed_data.get('content', '')
            if document_content:
                return f"{prompt}\n\nDocument content to analyze:\n{document_content}"
        except Exception as e:
            print(f"Error reading parsed document for AI: {str(e)}")
        
        return None


class EmailNodeExecutor(BaseNodeExecutor):
    """Executor for email nodes."""
    
    async def execute(self, context: NodeExecutionContext) -> ExecutionResult:
        try:
            email_data = self._build_email_data(context)
            result = await run_email_node(email_data)
            return ExecutionResult(True, result)
            
        except Exception as e:
            return ExecutionResult(False, None, f"Error executing email node: {str(e)}")
    
    def _build_email_data(self, context: NodeExecutionContext) -> Dict[str, Any]:
        """Build email data with attachments and enhanced content."""
        email_body = context.node.data.get("body", "")
        attachments = ContentProcessor.extract_file_attachments(context.input_data)
        
        # Add AI content to email body
        ai_content = ContentProcessor.extract_ai_content(context.input_data)
        if ai_content:
            email_body += "\n\n--- AI Generated Content ---\n"
            for ai_item in ai_content:
                email_body += f"\n**{ai_item['model']} Response:**\n"
                email_body += f"{ai_item['content']}\n"
                email_body += f"\n{'-' * 50}\n"
            
            email_body += f"\n\nThis email contains AI-generated content from your AutoFlow workflow.\n"
            email_body += f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        # Add document content
        email_body = self._add_document_content(email_body, context.input_data)
        
        return {
            **context.node.data,
            "body": email_body,
            "attachments": attachments
        }
    
    def _add_document_content(self, email_body: str, input_data: Dict[str, Any]) -> str:
        """Add parsed document content to email body."""
        for pred_id, pred_result in input_data.items():
            if "Document parsed:" not in str(pred_result):
                continue
            
            try:
                json_path = str(pred_result).split("Document parsed: ")[-1]
                with open(json_path, 'r', encoding='utf-8') as f:
                    parsed_data = json.load(f)
                
                email_body += f"\n\n--- Parsed Document Content ---\n"
                email_body += f"Document: {parsed_data.get('metadata', {}).get('file_name', 'Unknown')}\n"
                email_body += f"Type: {parsed_data.get('type', 'Unknown').upper()}\n"
                email_body += f"Pages: {parsed_data.get('total_pages', 'Unknown')}\n"
                
                content = parsed_data.get('content', '')
                if content.strip():
                    if len(content) > 5000:
                        content = content[:5000] + "\n\n... (content truncated for email)"
                    email_body += f"**Document Content:**\n{content}"
                else:
                    email_body += "**Note:** No text content could be extracted from this document."
                
            except Exception as e:
                email_body += f"\n\nError reading parsed document: {str(e)}"
        
        return email_body


class DiscordNodeExecutor(BaseNodeExecutor):
    """Executor for Discord nodes."""
    
    async def execute(self, context: NodeExecutionContext) -> ExecutionResult:
        try:
            discord_data = await self._build_discord_data(context)
            result = await run_discord_node(discord_data)
            return ExecutionResult(True, result)
        except Exception as e:
            return ExecutionResult(False, None, f"Error executing Discord node: {str(e)}")
    
    async def _build_discord_data(self, context: NodeExecutionContext) -> Dict[str, Any]:
        """Build Discord message data with embeds."""
        message = context.node.data.get("message", "")
        username = context.node.data.get("username", "AutoFlow Bot")
        webhook_url = context.node.data.get("webhook_url", "")
        
        # Get Discord webhook from user settings
        if context.api_manager:
            webhook_url = await context.api_manager.get_discord_webhook()
            if webhook_url:
                context.node.data["webhook_url"] = webhook_url
        
        if not webhook_url:
            raise ValueError("Discord webhook URL is required")
        
        # Build embeds from connected content
        embeds = self._build_discord_embeds(context)
        
        return {
            **context.node.data,
            "message": message,
            "embeds": embeds,
            "username": username,
            "webhook_url": webhook_url
        }
    
    def _build_discord_embeds(self, context: NodeExecutionContext) -> List[Dict[str, Any]]:
        """Build Discord embeds from input data."""
        embeds = []
        
        # Add main message embed if provided
        if context.node.data.get("message"):
            main_embed = {
                "title": "AutoFlow Workflow Results",
                "description": context.node.data.get("message"),
                "color": 5814783,
                "footer": {"text": "Sent via AutoFlow"}
            }
            embeds.append(main_embed)
        
        # Process input data for additional embeds
        for pred_id, pred_result in context.input_data.items():
            if not pred_result or not isinstance(pred_result, str):
                continue
                
            embed = self._create_embed_from_result(pred_id, pred_result)
            if embed:
                embeds.append(embed)
        
        return embeds[:10]  # Discord limit
    
    def _create_embed_from_result(self, pred_id: str, pred_result: str) -> Optional[Dict[str, Any]]:
        """Create Discord embed from node result."""
        if "Report generated:" in pred_result:
            report_path = pred_result.split("Report generated: ")[-1]
            return {
                "title": "Report Generated",
                "content": f"Report created: {os.path.basename(report_path)}",
                "color": 3066993
            }
        elif "Document parsed:" in pred_result:
            return {
                "title": "Document Processed",
                "content": "Document has been parsed and analyzed",
                "color": 3447003
            }
        elif "Image generated:" in pred_result:
            return {
                "title": "Generated Image",
                "content": f"Image created: {os.path.basename(pred_result.split('Image generated: ')[-1])}",
                "color": 10181046
            }
        elif ContentProcessor._is_ai_content(pred_result):
            ai_model = ContentProcessor._determine_ai_model(pred_id)
            return {
                "title": f"{ai_model} Response",
                "content": pred_result[:1500] + "..." if len(pred_result) > 1500 else pred_result,
                "color": 5814783
            }
        
        return None


class FileUploadNodeExecutor(BaseNodeExecutor):
    """Executor for file upload nodes."""
    
    async def execute(self, context: NodeExecutionContext) -> ExecutionResult:
        try:
            file_path = self._determine_file_path(context)
            if not file_path or not os.path.exists(file_path):
                return ExecutionResult(False, None, f"File not found at path: {file_path}")
            
            file_name = context.node.data.get("name") or os.path.basename(file_path)
            mime_type = self._get_mime_type(file_path, context.node.data.get("mime_type"))
            
            result = await upload_to_drive(file_path, file_name, mime_type)
            
            if result.get("success"):
                return ExecutionResult(True, f"File uploaded: {result['file_url']}")
            else:
                return ExecutionResult(False, None, "File upload failed: Unknown error")
                
        except Exception as e:
            return ExecutionResult(False, None, f"File upload failed: {str(e)}")
    
    def _determine_file_path(self, context: NodeExecutionContext) -> str:
        """Determine file path from node data or connected nodes."""
        file_path = context.node.data.get("path", "")
        
        # Check for files from connected nodes
        for pred_id, pred_result in context.input_data.items():
            if "Image generated:" in str(pred_result):
                image_path = str(pred_result).split("Image generated: ")[-1]
                if os.path.exists(image_path):
                    return image_path
            elif "Report generated:" in str(pred_result):
                report_path = str(pred_result).split("Report generated: ")[-1]
                if os.path.exists(report_path):
                    return report_path
            elif "Document parsed:" in str(pred_result):
                json_path = str(pred_result).split("Document parsed: ")[-1]
                if os.path.exists(json_path):
                    return json_path
        
        return file_path
    
    def _get_mime_type(self, file_path: str, provided_mime_type: str = None) -> str:
        """Get MIME type for file."""
        if provided_mime_type:
            return provided_mime_type
        
        import mimetypes
        mime_type, _ = mimetypes.guess_type(file_path)
        return mime_type or 'application/octet-stream'


class ImageGenerationNodeExecutor(BaseNodeExecutor):
    """Executor for image generation nodes."""
    
    async def execute(self, context: NodeExecutionContext) -> ExecutionResult:
        try:
            prompt = self._get_prompt(context)
            if not prompt:
                return ExecutionResult(False, None, "Image prompt is required")
            
            await self._setup_image_api_keys(context)
            
            updated_data = {**context.node.data, "prompt": prompt}
            result = await run_image_generation_node(updated_data)
            
            return ExecutionResult(True, result)
            
        except Exception as e:
            return ExecutionResult(False, None, f"Error generating image: {str(e)}")
    
    def _get_prompt(self, context: NodeExecutionContext) -> str:
        """Get image generation prompt."""
        prompt = context.node.data.get("prompt", "")
        
        # If no prompt, check AI-generated content
        if not prompt:
            for pred_id, pred_result in context.input_data.items():
                if ContentProcessor._is_ai_content(pred_result):
                    return pred_result.strip()[:500]
        
        return prompt
    
    async def _setup_image_api_keys(self, context: NodeExecutionContext) -> None:
        """Setup API keys for image generation."""
        if not context.api_manager:
            return
        
        provider = context.node.data.get("provider", "openai")
        if provider == "openai":
            api_key = await context.api_manager.get_openai_key()
            if api_key:
                os.environ["OPENAI_API_KEY"] = api_key
        elif provider == "stability":
            api_key = await context.api_manager.get_stability_key()
            if api_key:
                os.environ["STABILITY_API_KEY"] = api_key


class NodeExecutorFactory:
    """Factory for creating node executors."""
    
    _executors = {
        "gpt": AINodeExecutor,
        "llama": AINodeExecutor,
        "gemini": AINodeExecutor,
        "claude": AINodeExecutor,
        "mistral": AINodeExecutor,
        "email": EmailNodeExecutor,
        "discord": DiscordNodeExecutor,
        "file_upload": FileUploadNodeExecutor,
        "image_generation": ImageGenerationNodeExecutor,
    }
    
    @classmethod
    def create_executor(cls, node_type: str) -> Optional[BaseNodeExecutor]:
        """Create appropriate executor for node type."""
        executor_class = cls._executors.get(node_type)
        if executor_class:
            return executor_class()
        return None


class WorkflowEngine:
    """Main workflow execution engine."""
    
    def __init__(self):
        self.scheduler = WorkflowScheduler()
    
    async def run_workflow(self, nodes: List[Node], edges: List[Edge], user_id: Optional[str] = None) -> Dict[str, Any]:
        """Run a complete workflow."""
        try:
            # Build execution graph
            graph = self._build_graph(nodes, edges)
            
            # Handle webhook auto-registration
            self._register_webhook_workflows(nodes, edges)
            
            # Get execution order
            execution_order = self._get_execution_order(graph)
            if not execution_order:
                return {"error": "Cycle detected in workflow"}
            
            # Setup API manager
            api_manager = await get_user_api_manager(user_id) if user_id else None
            
            # Execute nodes
            results = await self._execute_nodes(graph, execution_order, api_manager, user_id)
            
            return results
            
        except Exception as e:
            return {"error": f"Workflow execution failed: {str(e)}"}
    
    def _build_graph(self, nodes: List[Node], edges: List[Edge]) -> nx.DiGraph:
        """Build NetworkX graph from nodes and edges."""
        graph = nx.DiGraph()
        
        for node in nodes:
            graph.add_node(node.id, data=node)
        
        for edge in edges:
            graph.add_edge(edge.source, edge.target)
            print(f"Added edge: {edge.source} -> {edge.target}")
        
        return graph
    
    def _register_webhook_workflows(self, nodes: List[Node], edges: List[Edge]) -> None:
        """Register webhook workflows for auto-triggering."""
        from ..main import stored_workflows
        
        webhook_nodes = [node for node in nodes if node.type == "webhook"]
        if webhook_nodes:
            for webhook_node in webhook_nodes:
                workflow_id = webhook_node.id
                workflow = Workflow(nodes=nodes, edges=edges)
                stored_workflows[workflow_id] = workflow
                print(f"Auto-registered webhook workflow: {workflow_id}")
    
    def _get_execution_order(self, graph: nx.DiGraph) -> Optional[List[str]]:
        """Get topological execution order."""
        try:
            execution_order = list(nx.topological_sort(graph))
            print(f"Execution order: {execution_order}")
            
            for node_id in execution_order:
                node_type = graph.nodes[node_id]["data"].type
                print(f"Node {node_id} ({node_type}) will execute")
            
            return execution_order
            
        except nx.NetworkXUnfeasible:
            print("Cycle detected - printing graph structure:")
            print(f"Nodes: {list(graph.nodes())}")
            print(f"Edges: {list(graph.edges())}")
            return None
    
    async def _execute_nodes(self, graph: nx.DiGraph, execution_order: List[str], 
                           api_manager: Any, user_id: Optional[str]) -> Dict[str, Any]:
        """Execute nodes in topological order."""
        results = {}
        
        for node_id in execution_order:
            node: Node = graph.nodes[node_id]["data"]
            input_data = {
                pred: results.get(pred)
                for pred in graph.predecessors(node_id)
            }
            
            print(f"Executing node {node_id} ({node.type})")
            print(f"Input data for {node_id}: {input_data}")
            
            # Execute node
            context = NodeExecutionContext(node, input_data, api_manager, user_id)
            result = await self._execute_single_node(context)
            
            results[node_id] = result
            print(f"Node {node_id} result: {result}")
        
        return results
    
    async def _execute_single_node(self, context: NodeExecutionContext) -> str:
        """Execute a single node."""
        print(f"Executing {context.node.type} node: {context.node.id}")
        
        # Try to use specific executor
        executor = NodeExecutorFactory.create_executor(context.node.type)
        if executor:
            result = await executor.execute(context)
            if result.success:
                return result.data
            else:
                return result.error_message or f"Error executing {context.node.type} node"
        
        # Fallback to legacy execution for non-refactored nodes
        return await self._execute_legacy_node(context)
    
    async def _execute_legacy_node(self, context: NodeExecutionContext) -> str:
        """Execute node using legacy method (for nodes not yet refactored)."""
        node = context.node
        input_data = context.input_data or {}
        api_manager = context.api_manager
        
        try:
            if node.type == "webhook":
                print(f"Processing webhook node with data: {node.data}")
                result = await run_webhook_node(node.data)
                print(f"Webhook node completed: {result}")
                return result
                
            elif node.type in ["sms", "whatsapp", "twilio"]:
                return await self._execute_messaging_node(context)
                
            elif node.type == "google_sheets":
                spreadsheet_id = node.data.get("spreadsheet_id")
                range_name = node.data.get("range")
                values = node.data.get("values", [])
                
                # Check for parsed document data
                for pred_id, pred_result in input_data.items():
                    if "Document parsed:" in str(pred_result):
                        values = self._extract_sheet_values_from_document(pred_result)
                        if values:
                            break
                
                result = write_to_sheet(spreadsheet_id, range_name, [values] if isinstance(values[0], str) else values)
                return result
                
            elif node.type == "schedule":
                cron_expr = node.data.get("cron", "*/1 * * * *")
                return f"Schedule set: {cron_expr}"
                
            elif node.type == "document_parser":
                file_path = self._get_document_parser_file_path(node, input_data)
                updated_data = {**node.data, "file_path": file_path}
                return await self._execute_document_parser(updated_data)
                
            elif node.type == "report_generator":
                return await self._execute_report_generator(node, input_data)
                
            elif node.type == "social_media":
                return await self._execute_social_media_node(node, input_data, api_manager)
            
            return f"{node.type} node not implemented"
            
        except Exception as e:
            return f"Error executing {node.type} node {node.id}: {str(e)}"
    
    def _extract_sheet_values_from_document(self, pred_result: str) -> Optional[List[List[str]]]:
        """Extract sheet values from parsed document."""
        try:
            json_path = pred_result.split("Document parsed: ")[-1]
            with open(json_path, 'r', encoding='utf-8') as f:
                parsed_data = json.load(f)
            
            if parsed_data.get('type') == 'excel':
                sheets = parsed_data.get('sheets', {})
                if sheets:
                    first_sheet = list(sheets.values())[0]
                    sheet_values = [first_sheet['columns']]
                    for row_data in first_sheet['data']:
                        row = [str(row_data.get(col, '')) for col in first_sheet['columns']]
                        sheet_values.append(row)
                    return sheet_values
            else:
                metadata = parsed_data.get('metadata', {})
                return [
                    ["Document Info", "Value"],
                    ["File Name", metadata.get('file_name', '')],
                    ["Type", parsed_data.get('type', '')],
                    ["Content", parsed_data.get('content', '')[:1000]]
                ]
        except Exception as e:
            print(f"Error reading parsed document for sheets: {str(e)}")
        return None
    
    def _get_document_parser_file_path(self, node: Node, input_data: Dict[str, Any]) -> str:
        """Get file path for document parser with enhanced download capability."""
        file_path = node.data.get("file_path", "")
        
        for pred_id, pred_result in input_data.items():
            if "File uploaded:" in str(pred_result):
                drive_url = str(pred_result).split("File uploaded: ")[-1].strip()
                print(f"📥 Attempting to download file for parsing: {drive_url}")
                
                # Since this is a sync method called from async context,
                # we need to handle the async download differently
                return drive_url  # Return the URL directly, handle download in async method
        
        return file_path

    async def _execute_document_parser(self, node_data: Dict[str, Any]) -> str:
        """Execute document parser with enhanced file handling and cleanup."""
        print(f"🔧 Attempting to import document parser...")
        
        # Get the file path (potentially a URL that needs downloading)
        file_path_or_url = node_data.get("file_path", "")
        
        # Check if we need to download the file first
        if file_path_or_url.startswith("http"):
            print(f"📥 Need to download file from: {file_path_or_url}")
            try:
                # Download the file asynchronously
                local_path = await self._download_file_for_parsing(file_path_or_url)
                if local_path:
                    print(f"✅ Successfully downloaded file to: {local_path}")
                    # Update node data with local path
                    node_data = {**node_data, "file_path": local_path}
                    file_path = local_path
                    is_temp_file = local_path.startswith("temp_downloads")
                else:
                    return "Error: Failed to download file for parsing"
            except Exception as e:
                return f"Error: Failed to download file: {str(e)}"
        else:
            file_path = file_path_or_url
            is_temp_file = file_path.startswith("temp_downloads") if file_path else False
        
        # Validate that we have a file path
        if not file_path:
            return "Error: No file path provided"
        
        if not os.path.exists(file_path):
            return f"Error: File not found at path: {file_path}"
        
        try:
            # Try multiple import methods
            methods = [
                lambda: self._import_document_parser_method1(),
                lambda: self._import_document_parser_method2(),
                lambda: self._import_document_parser_method3(),
                lambda: self._import_document_parser_method4(),
            ]
            
            for i, method in enumerate(methods, 1):
                try:
                    run_document_parser_node = method()
                    print(f"✅ Method {i}: Successfully imported document parser")
                    
                    # Execute document parsing
                    result = await run_document_parser_node(node_data)
                    
                    # Clean up temporary file if needed
                    if is_temp_file:
                        await self._cleanup_temp_files(file_path)
                    
                    return result
                    
                except Exception as e:
                    print(f"❌ Method {i} failed: {str(e)}")
                    continue
            
            # If all methods fail
            error_msg = (
                f"Error: Could not import document parser service. "
                f"Tried {len(methods)} different methods. "
                f"File path: {file_path}"
            )
            print(f"❌ {error_msg}")
            
            # Clean up temporary file even on failure
            if is_temp_file:
                await self._cleanup_temp_files(file_path)
            
            return error_msg
            
        except Exception as e:
            # Clean up temporary file on any error
            if is_temp_file:
                await self._cleanup_temp_files(file_path)
            
            error_msg = f"Document parsing failed: {str(e)}"
            print(f"❌ {error_msg}")
            return error_msg
    
    def _import_document_parser_method1(self):
        from services.document_parser import run_document_parser_node
        return run_document_parser_node
    
    def _import_document_parser_method2(self):
        import services.document_parser as doc_parser
        return doc_parser.run_document_parser_node
    
    def _import_document_parser_method3(self):
        import importlib
        doc_parser_module = importlib.import_module('services.document_parser')
        return getattr(doc_parser_module, 'run_document_parser_node')
    
    def _import_document_parser_method4(self):
        services_path = os.path.join(os.path.dirname(__file__), '..', '..', 'services')
        abs_services_path = os.path.abspath(services_path)
        
        if abs_services_path not in sys.path:
            sys.path.insert(0, abs_services_path)
            print(f"Added to path: {abs_services_path}")
        
        from services import run_document_parser_node
        return run_document_parser_node
    
    async def _execute_report_generator(self, node: Node, input_data: Dict[str, Any]) -> str:
        """Execute report generator with enhanced content from all connected nodes."""
        title = node.data.get("title", "AutoFlow Report")
        content = node.data.get("content", "")
        format_type = node.data.get("format", "pdf")
        
        report_content = content if content else "# AutoFlow Workflow Report\n\n"
        report_data = {}
        
        # Enhanced processing of input data for report content
        for pred_id, pred_result in input_data.items():
            if pred_result and isinstance(pred_result, str):
                print(f"📊 Processing input from node {pred_id}: {pred_result[:100]}...")
                
                if "File uploaded:" in pred_result:
                    report_content, report_data = await self._add_file_upload_content_to_report(
                        report_content, report_data, pred_result, pred_id)
                elif "Document parsed:" in pred_result:
                    report_content, report_data = self._add_document_content_to_report(
                        report_content, report_data, pred_result)
                elif ContentProcessor._is_ai_content(pred_result):
                    ai_model = ContentProcessor._determine_ai_model(pred_id)
                    report_content += f"## {ai_model} Analysis\n\n{pred_result}\n\n"
                    report_data[f"ai_response_{pred_id}"] = pred_result[:200] + "..." if len(pred_result) > 200 else pred_result
                elif "Image generated:" in pred_result:
                    image_path = pred_result.split("Image generated: ")[-1]
                    image_filename = os.path.basename(image_path)
                    report_content += f"## Generated Image\n\nImage created: {image_filename}\n\n"
                    report_data["generated_image"] = image_filename
                elif "Email sent successfully" in pred_result:
                    report_content += f"## Email Notification\n\n{pred_result}\n\n"
                    report_data[f"email_result_{pred_id}"] = pred_result
                elif "Webhook" in pred_result and "executed successfully" in pred_result:
                    report_content += f"## Webhook Execution\n\n{pred_result}\n\n"
                    report_data[f"webhook_result_{pred_id}"] = pred_result
                else:
                    # Generic result processing
                    report_content += f"## Node {pred_id} Result\n\n{pred_result}\n\n"
                    report_data[f"node_result_{pred_id}"] = pred_result[:100] + "..." if len(pred_result) > 100 else pred_result
        
        # Add workflow metadata
        report_data.update({
            "workflow_execution_time": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "total_nodes_processed": len(input_data),
            "report_generated_by": "AutoFlow Report Generator",
            "input_node_count": len([pred_id for pred_id, result in input_data.items() if result])
        })
        
        updated_data = {
            **node.data,
            "title": title,
            "content": report_content,
            "format": format_type,
            "data": report_data
        }
        
        print(f"📊 Generated report with {len(report_content)} characters of content")
        print(f"📈 Report data keys: {list(report_data.keys())}")
        
        return await run_report_generator_node(updated_data)

    async def _add_file_upload_content_to_report(self, content: str, data: Dict[str, Any], pred_result: str, pred_id: str) -> tuple:
        """Enhanced file upload content processing for reports."""
        try:
            file_url = pred_result.split("File uploaded: ")[-1].strip()
            print(f"📁 Processing uploaded file for report: {file_url}")
            
            # Extract file ID from Google Drive URL and get file info
            if "drive.google.com" in file_url and "/d/" in file_url:
                file_id = file_url.split("/d/")[1].split("/")[0]
                print(f"📋 Extracted file ID: {file_id}")
                
                # Try to get file metadata
                try:
                    from services.file_upload import get_drive_file_info
                    file_info_result = await get_drive_file_info(file_id)
                    
                    if file_info_result.get("success"):
                        file_info = file_info_result["file_info"]
                        
                        content += f"## Uploaded File Analysis\n\n"
                        content += f"**File Name:** {file_info.get('name', 'Unknown')}\n\n"
                        content += f"**File Type:** {file_info.get('mimeType', 'Unknown')}\n\n"
                        content += f"**File Size:** {self._format_file_size(file_info.get('size'))}\n\n"
                        content += f"**Upload Date:** {file_info.get('createdTime', 'Unknown')}\n\n"
                        content += f"**File URL:** [View File]({file_url})\n\n"
                        
                        if file_info.get('isGoogleWorkspace'):
                            content += f"**Type:** Google Workspace Document\n\n"
                        
                        # Store detailed file info in report data
                        data[f"uploaded_file_{pred_id}"] = {
                            "name": file_info.get('name'),
                            "type": file_info.get('mimeType'),
                            "size": file_info.get('size'),
                            "url": file_url,
                            "created": file_info.get('createdTime'),
                            "is_workspace": file_info.get('isGoogleWorkspace', False)
                        }
                        
                        # Try to download and analyze the file content if it's a document
                        if self._is_analyzable_file(file_info.get('mimeType', '')):
                            content += await self._analyze_uploaded_file_content(file_id, file_info)
                            
                    else:
                        # Fallback if we can't get file info
                        content += f"## Uploaded File\n\n"
                        content += f"**File URL:** [View File]({file_url})\n\n"
                        content += f"**Note:** Could not retrieve detailed file information.\n\n"
                        
                        data[f"uploaded_file_{pred_id}"] = {
                            "url": file_url,
                            "status": "info_unavailable"
                        }
                        
                except Exception as file_error:
                    print(f"⚠️ Could not get file info: {str(file_error)}")
                    content += f"## Uploaded File\n\n"
                    content += f"**File URL:** [View File]({file_url})\n\n"
                    content += f"**Error:** Could not retrieve file details - {str(file_error)}\n\n"
                    
                    data[f"uploaded_file_{pred_id}"] = {
                        "url": file_url,
                        "error": str(file_error)
                    }
            else:
                # Handle non-Google Drive URLs
                content += f"## Uploaded File\n\n"
                content += f"**File URL:** {file_url}\n\n"
                data[f"uploaded_file_{pred_id}"] = {"url": file_url}
            
        except Exception as e:
            print(f"❌ Error processing uploaded file: {str(e)}")
            content += f"## File Upload Error\n\nError processing uploaded file: {str(e)}\n\n"
            data[f"upload_error_{pred_id}"] = str(e)
        
        return content, data

    def _format_file_size(self, size_bytes):
        """Format file size in human readable format."""
        if not size_bytes or not str(size_bytes).isdigit():
            return "Unknown"
        
        size_bytes = int(size_bytes)
        if size_bytes < 1024:
            return f"{size_bytes} bytes"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
        else:
            return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

    def _is_analyzable_file(self, mime_type: str) -> bool:
        """Check if file type can be analyzed for content."""
        analyzable_types = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
            'application/json',
            'application/vnd.google-apps.document',
            'application/vnd.google-apps.spreadsheet'
        ]
        return any(mime_type.startswith(t) for t in analyzable_types)

    async def _analyze_uploaded_file_content(self, file_id: str, file_info: dict) -> str:
        """Download and analyze file content for the report with enhanced resume analysis."""
        try:
            print(f"🔍 Attempting to analyze file content for report...")
            
            # Download the file
            local_path = await download_from_drive(file_id)
            if not local_path or not os.path.exists(local_path):
                return "**Content Analysis:** Could not download file for analysis.\n\n"
            
            # Parse the document
            try:
                from services.document_parser import run_document_parser_node
                parse_result = await run_document_parser_node({"file_path": local_path})
                
                if "Document parsed:" in parse_result:
                    json_path = parse_result.split("Document parsed: ")[-1]
                    
                    if os.path.exists(json_path):
                        with open(json_path, 'r', encoding='utf-8') as f:
                            parsed_data = json.load(f)
                        
                        content_analysis = "### Content Analysis\n\n"
                        
                        # Add document metadata
                        metadata = parsed_data.get('metadata', {})
                        document_content = parsed_data.get('content', '')
                        
                        # Enhanced analysis for resume files
                        if self._is_resume_file(file_info.get('name', ''), document_content):
                            content_analysis += await self._analyze_resume_content(document_content, metadata)
                        else:
                            # General document analysis
                            content_analysis += self._analyze_general_document(document_content, metadata, parsed_data)
                        
                        # Cleanup temp files
                        try:
                            if local_path.startswith("downloads"):
                                os.remove(local_path)
                            if os.path.exists(json_path):
                                os.remove(json_path)
                        except:
                            pass
                        
                        return content_analysis
                    
                else:
                    return f"**Content Analysis:** {parse_result}\n\n"
                    
            except Exception as parse_error:
                print(f"⚠️ Document parsing failed: {str(parse_error)}")
                return f"**Content Analysis:** Could not parse document - {str(parse_error)}\n\n"
                
        except Exception as e:
            print(f"⚠️ File analysis error: {str(e)}")
            return f"**Content Analysis:** Analysis failed - {str(e)}\n\n"

    def _is_resume_file(self, filename: str, content: str) -> bool:
        """Check if the file appears to be a resume/CV."""
        filename_lower = filename.lower()
        content_lower = content.lower()
        
        # Check filename indicators
        resume_keywords_filename = ['resume', 'cv', 'curriculum', 'vitae']
        filename_indicators = any(keyword in filename_lower for keyword in resume_keywords_filename)
        
        # Check content indicators
        resume_keywords_content = [
            'experience', 'education', 'skills', 'employment', 'work history',
            'qualifications', 'achievements', 'objective', 'summary', 'career',
            'projects', 'certifications', 'languages', 'references'
        ]
        content_indicators = sum(1 for keyword in resume_keywords_content if keyword in content_lower)
        
        return filename_indicators or content_indicators >= 3

    async def _analyze_resume_content(self, content: str, metadata: dict) -> str:
        """Analyze resume content and extract key information."""
        analysis = "**Document Type:** Resume/CV\n\n"
        
        if metadata:
            if 'character_count' in metadata:
                analysis += f"**Character Count:** {metadata['character_count']:,}\n"
            if 'word_count' in metadata:
                analysis += f"**Word Count:** {metadata['word_count']:,}\n"
            analysis += "\n"
        
        # Extract key sections
        sections = self._extract_resume_sections(content)
        
        if sections:
            analysis += "**Resume Structure Analysis:**\n\n"
            
            for section_name, section_content in sections.items():
                if section_content:
                    analysis += f"- **{section_name}:** {len(section_content)} characters\n"
            
            analysis += "\n"
        
        # Extract key information
        key_info = self._extract_key_resume_info(content)
        
        if key_info:
            analysis += "**Key Information Extracted:**\n\n"
            
            if key_info.get('contact_info'):
                analysis += f"- **Contact Information:** Found {len(key_info['contact_info'])} contact items\n"
            
            if key_info.get('skills'):
                analysis += f"- **Skills Mentioned:** {len(key_info['skills'])} skills identified\n"
            
            if key_info.get('experience_years'):
                analysis += f"- **Experience Indicators:** {key_info['experience_years']} year references found\n"
            
            if key_info.get('education'):
                analysis += f"- **Education:** {len(key_info['education'])} education-related terms\n"
            
            analysis += "\n"
        
        # Content preview
        if len(content) > 500:
            content_preview = content[:500] + "..."
            analysis += f"**Content Preview:**\n\n```\n{content_preview}\n```\n\n"
        else:
            analysis += f"**Full Content:**\n\n```\n{content}\n```\n\n"
        
        return analysis

    def _extract_resume_sections(self, content: str) -> dict:
        """Extract common resume sections."""
        import re
        
        sections = {}
        content_lower = content.lower()
        
        # Common section headers
        section_patterns = {
            'Summary/Objective': r'(summary|objective|profile|overview)[\s\S]*?(?=\n[A-Z]|\n\n|\Z)',
            'Experience': r'(experience|employment|work history|professional experience)[\s\S]*?(?=\n[A-Z]|\n\n|\Z)',
            'Education': r'(education|academic|qualifications|degree)[\s\S]*?(?=\n[A-Z]|\n\n|\Z)',
            'Skills': r'(skills|competencies|technical skills|core competencies)[\s\S]*?(?=\n[A-Z]|\n\n|\Z)',
            'Projects': r'(projects|portfolio|work samples)[\s\S]*?(?=\n[A-Z]|\n\n|\Z)',
            'Certifications': r'(certifications|certificates|licenses)[\s\S]*?(?=\n[A-Z]|\n\n|\Z)'
        }
        
        for section_name, pattern in section_patterns.items():
            matches = re.findall(pattern, content_lower, re.IGNORECASE | re.MULTILINE)
            if matches:
                sections[section_name] = matches[0]
        
        return sections

    def _extract_key_resume_info(self, content: str) -> dict:
        """Extract key resume information."""
        import re
        
        key_info = {}
        
        # Extract contact information patterns
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        phone_pattern = r'[\+]?[1-9]?[0-9]{7,15}'
        
        emails = re.findall(email_pattern, content)
        phones = re.findall(phone_pattern, content)
        
        contact_info = []
        if emails:
            contact_info.extend(emails)
        if phones:
            contact_info.extend(phones)
        
        key_info['contact_info'] = contact_info
        
        # Extract skills (common technical terms)
        skill_keywords = [
            'python', 'java', 'javascript', 'react', 'node', 'sql', 'html', 'css',
            'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'machine learning',
            'data analysis', 'project management', 'leadership', 'communication'
        ]
        
        found_skills = [skill for skill in skill_keywords if skill.lower() in content.lower()]
        key_info['skills'] = found_skills
        
        # Extract experience years
        year_pattern = r'\b(19|20)\d{2}\b'
        years = re.findall(year_pattern, content)
        key_info['experience_years'] = len(set(years))
        
        # Extract education keywords
        education_keywords = [
            'bachelor', 'master', 'phd', 'degree', 'university', 'college',
            'graduate', 'undergraduate', 'diploma', 'certification'
        ]
        
        found_education = [edu for edu in education_keywords if edu.lower() in content.lower()]
        key_info['education'] = found_education
        
        return key_info

    def _analyze_general_document(self, content: str, metadata: dict, parsed_data: dict) -> str:
        """Analyze general document content."""
        analysis = f"**Document Type:** {parsed_data.get('type', 'Unknown').upper()}\n\n"
        
        # Add document metadata
        if metadata:
            if 'character_count' in metadata:
                analysis += f"**Character Count:** {metadata['character_count']:,}\n"
            if 'word_count' in metadata:
                analysis += f"**Word Count:** {metadata['word_count']:,}\n"
            analysis += "\n"
        
        # Add Excel-specific information
        if parsed_data.get('type') == 'excel':
            sheets = parsed_data.get('sheets', {})
            if sheets:
                analysis += f"**Spreadsheet Information:**\n\n"
                for sheet_name, sheet_data in sheets.items():
                    analysis += f"- **{sheet_name}:** {sheet_data.get('shape', {}).get('rows', 0)} rows, {sheet_data.get('shape', {}).get('columns', 0)} columns\n"
                analysis += "\n"
        
        # Content preview
        if content:
            if len(content) > 1000:
                content_summary = content[:1000] + "..."
                analysis += f"**Content Preview:**\n\n```\n{content_summary}\n```\n\n"
            else:
                analysis += f"**Full Content:**\n\n```\n{content}\n```\n\n"
        
        return analysis

# Global workflow engine instance
workflow_engine = WorkflowEngine()

# Maintain backward compatibility
scheduler = workflow_engine.scheduler.scheduler

def schedule_task(cron_expr: str, workflow: Dict[str, Any]) -> None:
    """Schedule a workflow task (backward compatibility)."""
    workflow_engine.scheduler.schedule_task(cron_expr, workflow)

def parse_cron_expr(expr: str) -> Dict[str, str]:
    """Parse cron expression (backward compatibility)."""
    return workflow_engine.scheduler._parse_cron_expr(expr)

def run_workflow_sync(workflow: Dict[str, Any]) -> Any:
    """Run workflow synchronously (backward compatibility)."""
    return workflow_engine.scheduler._run_workflow_sync(workflow)

async def run_workflow_engine(nodes: List[Node], edges: List[Edge], user_id: str = None) -> Dict[str, Any]:
    """Run workflow engine (backward compatibility)."""
    return await workflow_engine.run_workflow(nodes, edges, user_id)

async def execute_node(node: Node, input_data: Dict[str, Any] = None, api_manager=None) -> str:
    """Execute single node (backward compatibility)."""
    context = NodeExecutionContext(node, input_data or {}, api_manager)
    return await workflow_engine._execute_single_node(context)