# backend/app/core/runner.py

import networkx as nx
from typing import List, Dict, Any
from ..models.workflow import Node, Edge
import sys
import os
# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from services.gpt import run_gpt_node
from services.email import run_email_node
from services.webhook import run_webhook_node
from services.twilio_node import run_twilio_node
from services.googlesheets import write_to_sheet
from services.file_upload import upload_to_drive
from services.image_generation import run_image_generation_node
from services.discord import run_discord_node
from services.report_generator import run_report_generator_node
from services.social_media import run_social_media_node
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
import json
from datetime import datetime
from services.api_key_manager import get_user_api_manager

# Import database operations
from app.database.user_operations import get_user_by_id, update_user_stats
from app.database.workflow_operations import save_execution_history


scheduler = BackgroundScheduler()
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

def schedule_task(cron_expr, workflow):
    scheduler.add_job(
        lambda: run_workflow_sync(workflow),
        trigger="cron",
        **parse_cron_expr(cron_expr)
    )

def parse_cron_expr(expr):
    # "*/1 * * * *" → { "minute": "*/1" }
    fields = expr.split()
    return {
        "minute": fields[0],
        "hour": fields[1],
        "day": fields[2],
        "month": fields[3],
        "day_of_week": fields[4],
    }

def run_workflow_sync(workflow):
    # Synchronous version for scheduler
    import asyncio
    return asyncio.run(run_workflow_engine(workflow["nodes"], workflow["edges"]))

async def run_workflow_engine(nodes: List[Node], edges: List[Edge], user_id: str = None) -> Dict[str, Any]:
    
    G = nx.DiGraph()

    # Build the graph
    for node in nodes:
        G.add_node(node.id, data=node)
    for edge in edges:
        G.add_edge(edge.source, edge.target)
        print(f"Added edge: {edge.source} -> {edge.target}")  # Debug log

    # Auto-register webhook workflows
    from ..main import stored_workflows
    from ..models.workflow import Workflow
    
    webhook_nodes = [node for node in nodes if node.type == "webhook"]
    if webhook_nodes:
        for webhook_node in webhook_nodes:
            workflow_id = webhook_node.id
            workflow = Workflow(nodes=nodes, edges=edges)
            stored_workflows[workflow_id] = workflow
            print(f"Auto-registered webhook workflow: {workflow_id}")

    try:
        execution_order = list(nx.topological_sort(G))
        print(f"Execution order: {execution_order}")  # Debug log
        
        # Print node types in execution order
        for node_id in execution_order:
            node_type = G.nodes[node_id]["data"].type
            print(f"Node {node_id} ({node_type}) will execute")
            
    except nx.NetworkXUnfeasible:
        print("Cycle detected - printing graph structure:")
        print(f"Nodes: {list(G.nodes())}")
        print(f"Edges: {list(G.edges())}")
        return {"error": "Cycle detected in workflow"}

    # Create API key manager for this user if user_id is provided
    api_manager = None
    if user_id:
        api_manager = await get_user_api_manager(user_id)
    
    results = {}

    for node_id in execution_order:
        node: Node = G.nodes[node_id]["data"]
        input_data = {
            pred: results.get(pred)
            for pred in G.predecessors(node_id)
        }
        
        print(f"Executing node {node_id} ({node.type})")
        print(f"Input data for {node_id}: {input_data}")

        # Pass API manager to node execution
        output = await execute_node(node, input_data, api_manager)
        results[node_id] = output
        print(f"Node {node_id} result: {output}")

    return results

async def execute_node(node: Node, input_data: Dict[str, Any] = None, api_manager = None) -> str:
    """Execute a single node based on its type"""
    if input_data is None:
        input_data = {}
    
    print(f"🔧 Executing {node.type} node: {node.id}")
    
    try:
        if node.type in ["gpt", "llama", "gemini", "claude", "mistral"]:
            # Get API key for the model
            if api_manager:
                if node.type == "gpt" or node.data.get("model", "").startswith("openai"):
                    api_key = await api_manager.get_openai_key()
                    if api_key:
                        os.environ["OPENAI_API_KEY"] = api_key
                else:
                    # Use OpenRouter for other models
                    api_key = await api_manager.get_openrouter_key()
                    if api_key:
                        os.environ["OPENROUTER_API_KEY"] = api_key
            
            # Use 'prompt' field first, then fall back to 'label'
            prompt = node.data.get("prompt") or node.data.get("label", "")
            model = node.data.get("model", "meta-llama/llama-3-8b-instruct")
            
            if not prompt:
                return f"Error: No prompt provided for {node.type} node"
            
            # Check if there's parsed document content to use as input
            for pred_id, pred_result in input_data.items():
                if "Document parsed:" in str(pred_result):
                    json_path = str(pred_result).split("Document parsed: ")[-1]
                    try:
                        with open(json_path, 'r', encoding='utf-8') as f:
                            parsed_data = json.load(f)
                        
                        # Use document content as context for AI
                        document_content = parsed_data.get('content', '')
                        if document_content:
                            # Combine user prompt with document content
                            enhanced_prompt = f"{prompt}\n\nDocument content to analyze:\n{document_content}"
                            prompt = enhanced_prompt
                            print(f"Enhanced AI prompt with document content")
                            break
                    except Exception as e:
                        print(f"Error reading parsed document for AI: {str(e)}")
            
            return await run_gpt_node(prompt, model)
        elif node.type == "email":
            # Check if there's file data from connected nodes
            attachments = []
            email_body = node.data.get("body", "")
            
            print(f"Email node input_data: {input_data}")
            
            # Enhanced AI content integration
            ai_content_added = False
            
            for pred_id, pred_result in input_data.items():
                print(f"Checking predecessor {pred_id}: {pred_result}")
                
                # Handle document parsing results FIRST (before AI content check)
                if "Document parsed:" in str(pred_result):
                    json_path = str(pred_result).split("Document parsed: ")[-1]
                    try:
                        with open(json_path, 'r', encoding='utf-8') as f:
                            parsed_data = json.load(f)
                        
                        # Add document content to email body
                        email_body += f"\n\n--- Parsed Document Content ---\n"
                        email_body += f"📄 Document: {parsed_data.get('metadata', {}).get('file_name', 'Unknown')}\n"
                        email_body += f"📋 Type: {parsed_data.get('type', 'Unknown').upper()}\n"
                        email_body += f"📖 Pages: {parsed_data.get('total_pages', 'Unknown')}\n"
                        email_body += f"📏 Content Length: {parsed_data.get('metadata', {}).get('character_count', 0)} characters\n\n"
                        
                        # Add the main content
                        if 'content' in parsed_data and parsed_data['content'].strip():
                            content = parsed_data['content']
                            # Limit content length for email but provide more than before
                            if len(content) > 5000:
                                content = content[:5000] + "\n\n... (content truncated for email)"
                            email_body += f"**Document Content:**\n{content}"
                        else:
                            email_body += "**Note:** No text content could be extracted from this document. This may be an image-based PDF or contain non-text elements."
                        
                        # Attach the JSON file
                        attachments.append({
                            "path": json_path,
                            "name": "parsed_document.json",
                            "type": "file"
                        })
                        
                        print(f"Added parsed document content to email")
                    except Exception as e:
                        email_body += f"\n\nError reading parsed document: {str(e)}"
                
                # Handle AI-generated content from any AI model (but not document parsing results)
                elif isinstance(pred_result, str) and len(pred_result.strip()) > 10:
                    # Check if this is AI-generated content (not error messages or system responses)
                    # EXCLUDE document parsing results from being treated as AI content
                    if not any(error_word in pred_result.lower() for error_word in 
                              ["failed", "error", "not implemented", "sent successfully", 
                               "uploaded", "generated:", "deleted", "saved", "webhook", "document parsed:"]):
                        
                        # This appears to be AI-generated content
                        if not ai_content_added:
                            email_body += "\n\n--- AI Generated Content ---\n"
                            ai_content_added = True
                        
                        # Determine AI model type for better formatting
                        ai_model = "AI Assistant"
                        if "gpt" in str(pred_id).lower() or "openai" in str(pred_result).lower():
                            ai_model = "GPT"
                        elif "claude" in str(pred_id).lower():
                            ai_model = "Claude"
                        elif "gemini" in str(pred_id).lower():
                            ai_model = "Gemini"
                        elif "llama" in str(pred_id).lower():
                            ai_model = "Llama"
                        elif "mistral" in str(pred_id).lower():
                            ai_model = "Mistral"
                        
                        email_body += f"\n**{ai_model} Response:**\n"
                        email_body += f"{pred_result}\n"
                        email_body += f"\n{'-' * 50}\n"
                        
                        print(f"✉️ Added {ai_model} content to email")
                
                # Handle report generation results
                elif "Report generated:" in str(pred_result):
                    report_path = str(pred_result).split("Report generated: ")[-1]
                    if os.path.exists(report_path):
                        attachments.append({
                            "path": report_path,
                            "name": os.path.basename(report_path),
                            "type": "file"
                        })
                        email_body += f"\n\n📊 Generated report attached: {os.path.basename(report_path)}"
                        print(f"Added report attachment: {report_path}")
                
                # Handle file upload results
                elif "File uploaded:" in str(pred_result):
                    file_url = str(pred_result).split("File uploaded: ")[-1]
                    attachments.append({
                        "url": file_url,
                        "name": "uploaded_file",
                        "type": "url"
                    })
                    email_body += f"\n\n📁 Attached file: {file_url}"
                    print(f"Added file attachment: {file_url}")
                
                # Handle image generation results
                elif "Image generated:" in str(pred_result):
                    image_path = str(pred_result).split("Image generated: ")[-1]
                    attachments.append({
                        "path": image_path,
                        "name": "generated_image",
                        "type": "file"
                    })
                    email_body += f"\n\n🎨 Generated image attached"
                    print(f"Added image attachment: {image_path}")
                
            # If AI content was added, add a footer
            if ai_content_added:
                email_body += f"\n\n🤖 This email contains AI-generated content from your AutoFlow workflow.\n"
                email_body += f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            print(f"Final email body length: {len(email_body)} characters")
            print(f"Final attachments: {len(attachments)} items")
            
            # Update email data with enhanced content
            email_data = {**node.data, "body": email_body, "attachments": attachments}
            return await run_email_node(email_data)
        elif node.type == "webhook":
            print(f"🪝 Processing webhook node with data: {node.data}")
            result = await run_webhook_node(node.data)
            print(f"🪝 Webhook node completed: {result}")
            return result
        elif node.type in ["sms", "whatsapp", "twilio"]:
            # Get message and phone number from node data
            message = node.data.get("message", "")
            phone_number = node.data.get("to", "")
            mode = node.data.get("mode", "whatsapp")
            
            # Validate required fields
            if not phone_number:
                return "Error: Phone number is required for SMS/WhatsApp"
            if not message:
                return "Error: Message content is required for SMS/WhatsApp"
            
            # Check if there's parsed document content for messaging
            for pred_id, pred_result in input_data.items():
                if "Document parsed:" in str(pred_result):
                    json_path = str(pred_result).split("Document parsed: ")[-1]
                    try:
                        with open(json_path, 'r', encoding='utf-8') as f:
                            parsed_data = json.load(f)
                        
                        # Add document summary to message
                        doc_name = parsed_data.get('metadata', {}).get('file_name', 'Document')
                        content = parsed_data.get('content', '')
                        
                        # Create a summary for messaging (limit length)
                        summary = content[:500] + "..." if len(content) > 500 else content
                        enhanced_message = f"{message}\n\nDocument: {doc_name}\nSummary: {summary}"
                        
                        # Update node data with enhanced message
                        updated_data = {**node.data, "message": enhanced_message}
                        return await run_twilio_node(updated_data)
                    except Exception as e:
                        print(f"Error reading parsed document for messaging: {str(e)}")
                # Check for AI-generated content to include in message
                elif isinstance(pred_result, str) and len(pred_result.strip()) > 10:
                    if not any(error_word in pred_result.lower() for error_word in 
                              ["failed", "error", "not implemented", "sent successfully", "uploaded", "generated:"]):
                        # Add AI content to message
                        ai_summary = pred_result[:300] + "..." if len(pred_result) > 300 else pred_result
                        enhanced_message = f"{message}\n\nAI Analysis: {ai_summary}"
                        updated_data = {**node.data, "message": enhanced_message, "to": phone_number}
                        return await run_twilio_node(updated_data)
            
            # No connected content, use original data
            return await run_twilio_node(node.data)
        elif node.type == "discord":
            # Enhanced Discord integration with multiple node types
            message = node.data.get("message", "")
            username = node.data.get("username", "AutoFlow Bot")
            webhook_url = node.data.get("webhook_url", "")
            
            # Get Discord webhook from user settings
            if api_manager:
                webhook_url = await api_manager.get_discord_webhook()
                if webhook_url:
                    node.data["webhook_url"] = webhook_url
            
            if not webhook_url:
                return "Error: Discord webhook URL is required"
            
            # Collect content from all connected nodes
            discord_content = []
            
            for pred_id, pred_result in input_data.items():
                if pred_result and isinstance(pred_result, str):
                    # Handle Report generation results
                    if "Report generated:" in pred_result:
                        report_path = pred_result.split("Report generated: ")[-1]
                        report_filename = os.path.basename(report_path)
                        discord_content.append({
                            "type": "report",
                            "title": "📊 Report Generated",
                            "content": f"Report created: {report_filename}\nPath: {report_path}",
                            "color": 3066993  # Green
                        })
                    
                    # Handle Document parsing results
                    elif "Document parsed:" in pred_result:
                        json_path = pred_result.split("Document parsed: ")[-1]
                        try:
                            with open(json_path, 'r', encoding='utf-8') as f:
                                parsed_data = json.load(f)
                            
                            doc_name = parsed_data.get('metadata', {}).get('file_name', 'Document')
                            doc_type = parsed_data.get('type', 'Unknown')
                            content = parsed_data.get('content', '')
                            
                            # Create a formatted summary for Discord
                            summary = content[:800] + "..." if len(content) > 800 else content;
                            
                            discord_content.append({
                                "type": "document",
                                "title": f"📄 Document: {doc_name}",
                                "content": f"**Type:** {doc_type}\n**Summary:**\n{summary}",
                                "color": 3447003  # Blue
                            })
                            
                        except Exception as e:
                            discord_content.append({
                                "type": "error",
                                "title": "⚠️ Document Error",
                                "content": f"Error reading parsed document: {str(e)}",
                                "color": 15158332  # Red
                            })
                    
                    # Handle Image generation results
                    elif "Image generated:" in pred_result:
                        image_path = pred_result.split("Image generated: ")[-1]
                        if os.path.exists(image_path):
                            # Convert local path to URL if possible
                            image_filename = os.path.basename(image_path)
                            discord_content.append({
                                "type": "image",
                                "title": "🎨 Generated Image",
                                "content": f"Image created: {image_filename}",
                                "image_path": image_path,
                                "color": 10181046  # Purple
                            })
                    
                    # Handle File upload results
                    elif "File uploaded:" in pred_result:
                        file_url = pred_result.split("File uploaded: ")[-1]
                        discord_content.append({
                            "type": "file",
                            "title": "📁 File Uploaded",
                            "content": f"[View File]({file_url})",
                            "color": 3066993  # Green
                        })
                    
                    # Handle AI responses (GPT, Claude, etc.)
                    elif not any(error_word in pred_result.lower() for error_word in 
                                ["failed", "error", "not implemented", "sent successfully", "uploaded", "generated:"]) and \
                         len(pred_result.strip()) > 10:
                    
                        # Determine AI model from predecessor nodes
                        ai_model = "AI"
                        if "gpt" in str(pred_id).lower():
                            ai_model = "🤖 GPT"
                        elif "claude" in str(pred_id).lower():
                            ai_model = "🧠 Claude"
                        elif "gemini" in str(pred_id).lower():
                            ai_model = "💎 Gemini"
                        elif "llama" in str(pred_id).lower():
                            ai_model = "🦙 Llama"
                        
                        # Limit AI response length for Discord
                        ai_response = pred_result[:1500] + "..." if len(pred_result) > 1500 else pred_result
                        
                        discord_content.append({
                            "type": "ai",
                            "title": f"{ai_model} Response",
                            "content": ai_response,
                            "color": 5814783  # Blue
                        })
                    
                    # Handle Email results
                    elif "email sent" in pred_result.lower():
                        discord_content.append({
                            "type": "notification",
                            "title": "📧 Email Sent",
                            "content": pred_result,
                            "color": 3066993  # Green
                        })
                    
                    # Handle SMS/WhatsApp results
                    elif any(service in pred_result.lower() for service in ["sms", "whatsapp"]):
                        discord_content.append({
                            "type": "notification",
                            "title": "📱 Message Sent",
                            "content": pred_result,
                            "color": 3066993  # Green
                        })
            
            # Build Discord message
            if discord_content:
                # Create rich embeds for multiple content pieces
                embeds = []
                
                # Add main message if provided
                if message:
                    main_embed = {
                        "title": "🔗 AutoFlow Workflow Results",
                        "description": message,
                        "color": 5814783,
                        "footer": {"text": "Sent via AutoFlow"}
                    }
                    embeds.append(main_embed)
                
                # Add content embeds (Discord allows up to 10 embeds)
                for i, content in enumerate(discord_content[:9]):  # Leave room for main embed
                    embed = {
                        "title": content["title"],
                        "description": content["content"],
                        "color": content["color"]
                    }
                    
                    # Add image if available
                    if content.get("image_path") and os.path.exists(content["image_path"]):
                        # For now, just mention the image file
                        embed["description"] += f"\n\nImage file: {os.path.basename(content['image_path'])}"
                    
                    embeds.append(embed)
                
                # Send to Discord with embeds
                updated_data = {
                    **node.data,
                    "message": "",  # Use embeds instead
                    "embeds": embeds,
                    "username": username
                }
                
            else:
                # No connected content, send original message
                updated_data = {
                    **node.data,
                    "message": message or "AutoFlow workflow completed!",
                    "username": username
                }
            
            return await run_discord_node(updated_data)
        elif node.type == "google_sheets":
            spreadsheet_id = node.data.get("spreadsheet_id")
            range_name = node.data.get("range")
            values = node.data.get("values", [])
            
            # Check if there's parsed document data to add to sheets
            for pred_id, pred_result in input_data.items():
                if "Document parsed:" in str(pred_result):
                    json_path = str(pred_result).split("Document parsed: ")[-1]
                    try:
                        with open(json_path, 'r', encoding='utf-8') as f:
                            parsed_data = json.load(f)
                        
                        # Extract data for Google Sheets
                        if parsed_data.get('type') == 'excel':
                            # If it's Excel data, use the first sheet
                            sheets = parsed_data.get('sheets', {})
                            if sheets:
                                first_sheet = list(sheets.values())[0]
                                # Convert to values format for Google Sheets
                                sheet_values = [first_sheet['columns']]  # Header row
                                for row_data in first_sheet['data']:
                                    row = [str(row_data.get(col, '')) for col in first_sheet['columns']]
                                    sheet_values.append(row)
                                values = sheet_values
                        else:
                            # For other document types, create a simple structure
                            metadata = parsed_data.get('metadata', {})
                            values = [
                                ["Document Info", "Value"],
                                ["File Name", metadata.get('file_name', '')],
                                ["Type", parsed_data.get('type', '')],
                                ["Content", parsed_data.get('content', '')[:1000]]  # Limit content
                            ]
                        break
                    except Exception as e:
                        print(f"Error reading parsed document for sheets: {str(e)}")
            
            result = write_to_sheet(spreadsheet_id, range_name, [values] if isinstance(values[0], str) else values)
            return result
        elif node.type == "schedule":
            cron_expr = node.data.get("cron", "*/1 * * * *")
            return f"Schedule set: {cron_expr}"
        elif node.type == "file_upload":
            file_info = node.data
            
            # Check if there's a file path configured
            file_path = file_info.get("path", "")
            file_name = file_info.get("name", "")
            mime_type = file_info.get("mime_type", "")
            
            if not file_path:
                return "Error: No file selected for upload. Please configure the file upload node with a file."
            
            # Check if there's an image from a connected image generation node
            for pred_id, pred_result in input_data.items():
                if "Image generated:" in str(pred_result):
                    # Extract the image file path
                    image_path = str(pred_result).split("Image generated: ")[-1]
                    if os.path.exists(image_path):
                        # Update file info with the generated image
                        file_path = image_path
                        file_name = file_name or os.path.basename(image_path)
                        mime_type = mime_type or "image/png"
                        print(f"📸 Using generated image: {image_path}")
                        break
                elif "Report generated:" in str(pred_result):
                    # Handle report files
                    report_path = str(pred_result).split("Report generated: ")[-1]
                    if os.path.exists(report_path):
                        file_path = report_path
                        file_name = file_name or os.path.basename(report_path)
                        # Detect MIME type for reports
                        if report_path.endswith('.pdf'):
                            mime_type = "application/pdf"
                        elif report_path.endswith('.docx'):
                            mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        print(f"📊 Using generated report: {report_path}")
                        break
                elif "Document parsed:" in str(pred_result):
                    # Handle parsed document JSON files
                    json_path = str(pred_result).split("Document parsed: ")[-1]
                    if os.path.exists(json_path):
                        file_path = json_path
                        file_name = file_name or os.path.basename(json_path)
                        mime_type = "application/json"
                        print(f"📄 Using parsed document JSON: {json_path}")
                        break
            
            # Validate file exists before upload
            if not file_path or not os.path.exists(file_path):
                return f"Error: File not found at path: {file_path}. Please upload a file first or connect to a node that generates files."
            
            # Auto-generate file name if not provided
            if not file_name:
                file_name = os.path.basename(file_path)
            
            # Auto-detect MIME type if not provided
            if not mime_type:
                import mimetypes
                mime_type, _ = mimetypes.guess_type(file_path)
                if not mime_type:
                    mime_type = 'application/octet-stream'
            
            try:
                print(f"🚀 Starting file upload:")
                print(f"   📁 File: {file_path}")
                print(f"   📝 Name: {file_name}")
                print(f"   🏷️ Type: {mime_type}")
                
                result = await upload_to_drive(file_path, file_name, mime_type)
                
                if result.get("success"):
                    file_size_kb = int(result.get("file_size", 0)) / 1024 if result.get("file_size") else 0
                    success_msg = f"File uploaded successfully: {file_name}"
                    if file_size_kb > 0:
                        success_msg += f" ({file_size_kb:.1f} KB)"
                    
                    print(f"✅ {success_msg}")
                    return f"File uploaded: {result['file_url']}"
                else:
                    return "File upload failed: Unknown error"
                    
            except Exception as e:
                error_msg = f"File upload failed: {str(e)}"
                print(f"❌ {error_msg}")
                return error_msg
        elif node.type == "image_generation":
            # Get prompt from node data
            prompt = node.data.get("prompt", "")
            
            # If no prompt in node data, check if there's text input from connected AI nodes
            if not prompt:
                for pred_id, pred_result in input_data.items():
                    if isinstance(pred_result, str) and len(pred_result.strip()) > 0:
                        # Filter out error messages and system responses
                        if not any(error_word in pred_result.lower() for error_word in 
                                  ["failed", "error", "not implemented", "sent successfully", "uploaded"]):
                            # Use AI-generated text as the image prompt
                            prompt = pred_result.strip()[:500]  # Limit prompt length
                            print(f"Using AI-generated prompt: {prompt[:100]}...")
                            break
            
            # Still no prompt found
            if not prompt:
                return "Error: Image prompt is required"
            
            # Update node data with the prompt
            updated_node_data = {**node.data, "prompt": prompt}
            
            # Get API keys based on provider
            if api_manager:
                provider = node.data.get("provider", "openai")
                if provider == "openai":
                    api_key = await api_manager.get_openai_key()
                    if api_key:
                        os.environ["OPENAI_API_KEY"] = api_key
                elif provider == "stability":
                    api_key = await api_manager.get_stability_key()
                    if api_key:
                        os.environ["STABILITY_API_KEY"] = api_key
            
            return await run_image_generation_node(updated_node_data)
        elif node.type == "document_parser":
            # Check if there's a file from connected file upload nodes
            file_path = node.data.get("file_path", "")
            
            # Use file from connected upload node if available
            for pred_id, pred_result in input_data.items():
                if "File uploaded:" in str(pred_result):
                    # For Google Drive URLs, we need to download the file first
                    drive_url = str(pred_result).split("File uploaded: ")[-1]
                    print(f"Document parser received Google Drive URL: {drive_url}")
                    
                    # Extract file ID from Google Drive URL
                    if "drive.google.com" in drive_url and "/d/" in drive_url:
                        try:
                            file_id = drive_url.split("/d/")[1].split("/")[0]
                            
                            # Download file from Google Drive
                            from services.file_upload import download_from_drive
                            downloaded_path = await download_from_drive(file_id)
                            if downloaded_path:
                                file_path = downloaded_path
                                print(f"Downloaded file from Drive to: {file_path}")
                            else:
                                return "Error: Failed to download file from Google Drive"
                        except Exception as e:
                            return f"Error: Failed to process Google Drive URL: {str(e)}"
                    else:
                        # If it's a local file path
                        file_path = drive_url
                    break
            
            updated_node_data = {**node.data, "file_path": file_path}
            
            # Try multiple import methods to fix the import issue
            print(f"🔧 Attempting to import document parser...")
            
            # Method 1: Direct import from services
            try:
                from services.document_parser import run_document_parser_node
                print(f"✅ Method 1: Successfully imported document parser")
                result = await run_document_parser_node(updated_node_data)
                return result
            except Exception as e1:
                print(f"❌ Method 1 failed: {str(e1)}")
            
            # Method 2: Absolute import
            try:
                import services.document_parser as doc_parser
                print(f"✅ Method 2: Successfully imported document parser module")
                result = await doc_parser.run_document_parser_node(updated_node_data)
                return result
            except Exception as e2:
                print(f"❌ Method 2 failed: {str(e2)}")
            
            # Method 3: Dynamic import
            try:
                import importlib
                doc_parser_module = importlib.import_module('services.document_parser')
                run_document_parser_node = getattr(doc_parser_module, 'run_document_parser_node')
                print(f"✅ Method 3: Successfully imported via importlib")
                result = await run_document_parser_node(updated_node_data)
                return result
            except Exception as e3:
                print(f"❌ Method 3 failed: {str(e3)}")
            
            # Method 4: Add to path and import
            try:
                
                services_path = os.path.join(os.path.dirname(__file__), '..', '..', 'services')
                abs_services_path = os.path.abspath(services_path)
                
                if abs_services_path not in sys.path:
                    sys.path.insert(0, abs_services_path)
                    print(f"📁 Added to path: {abs_services_path}")
                
                from services import run_document_parser_node
                print(f"✅ Method 4: Successfully imported after path addition")
                result = await run_document_parser_node(updated_node_data)
                return result
            except Exception as e4:
                print(f"❌ Method 4 failed: {str(e4)}")
            
            # If all methods fail, return error with diagnostic info
            error_msg = (
                f"Error: Could not import document parser service. "
                f"Tried 4 different methods. "
                f"Current working directory: {os.getcwd()}. "
                f"Services path exists: {os.path.exists(services_path)}. "
                f"Document parser file exists: {os.path.exists(os.path.join(services_path, 'document_parser.py'))}"
            )
            print(f"❌ {error_msg}")
            return error_msg
        elif node.type == "report_generator":
            # Enhanced report generation with workflow data integration
            title = node.data.get("title", "AutoFlow Report")
            content = node.data.get("content", "")
            format_type = node.data.get("format", "pdf")
            
            # Collect content from connected nodes for report generation
            report_content = content if content else "# AutoFlow Workflow Report\n\n"
            report_data = {}
            
            for pred_id, pred_result in input_data.items():
                if pred_result and isinstance(pred_result, str):
                    # Handle File Upload results - download and process uploaded files
                    if "File uploaded:" in pred_result:
                        file_url = pred_result.split("File uploaded: ")[-1]
                        
                        # Extract file ID from Google Drive URL and download for report processing
                        if "drive.google.com" in file_url and "/d/" in file_url:
                            try:
                                file_id = file_url.split("/d/")[1].split("/")[0]
                                
                                # Download file from Google Drive for report processing
                                from services.file_upload import download_from_drive
                                downloaded_path = await download_from_drive(file_id)
                                
                                if downloaded_path:
                                    # Parse the downloaded file to include in report
                                    from services.document_parser import run_document_parser_node
                                    parse_result = await run_document_parser_node({"file_path": downloaded_path})
                                    
                                    if "Document parsed:" in parse_result:
                                        json_path = parse_result.split("Document parsed: ")[-1]
                                        try:
                                            with open(json_path, 'r', encoding='utf-8') as f:
                                                parsed_data = json.load(f)
                                            
                                            file_name = parsed_data.get('metadata', {}).get('file_name', 'Uploaded File')
                                            file_type = parsed_data.get('type', 'Unknown')
                                            file_content = parsed_data.get('content', '')
                                            
                                            report_content += f"## Uploaded File Analysis: {file_name}\n\n"
                                            report_content += f"**File Type:** {file_type}\n"
                                            report_content += f"**Source:** {file_url}\n\n"
                                            report_content += f"**Content:**\n{file_content[:2000]}...\n\n"
                                            
                                            report_data[f"uploaded_file_{file_name}"] = {
                                                "type": file_type,
                                                "url": file_url,
                                                "size": parsed_data.get('metadata', {}).get('file_size', 'Unknown')
                                            }
                                            
                                            print(f"📄 Added uploaded file analysis to report: {file_name}")
                                            
                                        except Exception as e:
                                            report_content += f"## Uploaded File Error\n\nError processing uploaded file: {str(e)}\n\n"
                                    else:
                                        # File uploaded but couldn't be parsed - still mention it
                                        report_content += f"## Uploaded File\n\n"
                                        report_content += f"**File URL:** {file_url}\n"
                                        report_content += f"Note: File uploaded successfully but content could not be analyzed.\n\n"
                                        
                                        report_data["uploaded_file"] = file_url
                                else:
                                    report_content += f"## File Upload Error\n\nFailed to download file from: {file_url}\n\n"
                            except Exception as e:
                                report_content += f"## File Processing Error\n\nError processing uploaded file: {str(e)}\n\n"
                        else:
                            # Local file path or other URL format
                            report_content += f"## Uploaded File\n\n"
                            report_content += f"**File URL:** {file_url}\n\n"
                            report_data["uploaded_file"] = file_url
                    
                    # Handle Document parsing results (direct document upload to document parser)
                    elif "Document parsed:" in pred_result:
                        json_path = pred_result.split("Document parsed: ")[-1]
                        try:
                            with open(json_path, 'r', encoding='utf-8') as f:
                                parsed_data = json.load(f)
                        
                            doc_name = parsed_data.get('metadata', {}).get('file_name', 'Document')
                            doc_type = parsed_data.get('type', 'Unknown')
                            doc_content = parsed_data.get('content', '')
                            
                            report_content += f"## Document Analysis: {doc_name}\n\n"
                            report_content += f"**Type:** {doc_type}\n\n"
                            report_content += f"**Content Summary:**\n{doc_content[:1500]}...\n\n"
                            
                            report_data[f"document_{doc_name}"] = {
                                "type": doc_type,
                                "size": parsed_data.get('metadata', {}).get('file_size', 'Unknown')
                            }
                            
                        except Exception as e:
                            report_content += f"## Document Analysis Error\n\nError reading document: {str(e)}\n\n"
                    
                    # Handle AI responses
                    elif not any(error_word in pred_result.lower() for error_word in 
                                ["failed", "error", "not implemented", "sent successfully", "uploaded", "generated:"]) and \
                         len(pred_result.strip()) > 10:
                        
                        # Determine AI model
                        ai_model = "AI Analysis"
                        if "gpt" in str(pred_id).lower():
                            ai_model = "GPT Analysis"
                        elif "claude" in str(pred_id).lower():
                            ai_model = "Claude Analysis"
                        elif "gemini" in str(pred_id).lower():
                            ai_model = "Gemini Analysis"
                        
                        report_content += f"## {ai_model}\n\n"
                        report_content += f"{pred_result}\n\n"
                        
                        report_data[f"ai_response_{pred_id}"] = pred_result[:100] + "..." if len(pred_result) > 100 else pred_result
                    
                    # Handle Image generation results
                    elif "Image generated:" in pred_result:
                        image_path = pred_result.split("Image generated: ")[-1]
                        image_filename = os.path.basename(image_path)
                        
                        report_content += f"## Generated Image\n\n"
                        report_content += f"Image created: {image_filename}\n"
                        report_content += f"Path: {image_path}\n\n"
                        
                        report_data["generated_image"] = image_filename
            
            # Add workflow metadata
            report_data["workflow_execution_time"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            report_data["total_nodes_processed"] = len(input_data)
            
            # Update node data with enhanced content
            updated_data = {
                **node.data,
                "title": title,
                "content": report_content,
                "format": format_type,
                "data": report_data
            }
            
            return await run_report_generator_node(updated_data)
        elif node.type == "social_media":
            # Enhanced social media posting with content from connected nodes
            platform = node.data.get("platform", "twitter")
            content = node.data.get("content", "")
            image_path = node.data.get("image_path", "")
            webhook_url = node.data.get("webhook_url", "")
            
            # Get social media credentials
            if api_manager:
                platform = node.data.get("platform", "twitter")
                
                if platform == "twitter":
                    twitter_creds = await api_manager.get_twitter_credentials()
                    if twitter_creds["api_key"]:
                        os.environ["TWITTER_API_KEY"] = twitter_creds["api_key"]
                    if twitter_creds["api_secret"]:
                        os.environ["TWITTER_API_SECRET"] = twitter_creds["api_secret"]
                    if twitter_creds["access_token"]:
                        os.environ["TWITTER_ACCESS_TOKEN"] = twitter_creds["access_token"]
                    if twitter_creds["access_secret"]:
                        os.environ["TWITTER_ACCESS_TOKEN_SECRET"] = twitter_creds["access_secret"]
                
                elif platform == "linkedin":
                    linkedin_token = await api_manager.get_linkedin_token()
                    if linkedin_token:
                        os.environ["LINKEDIN_ACCESS_TOKEN"] = linkedin_token
                
                elif platform == "instagram":
                    instagram_token = await api_manager.get_instagram_token()
                    if instagram_token:
                        os.environ["INSTAGRAM_ACCESS_TOKEN"] = instagram_token
            
            # Collect content from connected nodes
            enhanced_content = content
            final_image_path = image_path
            
            for pred_id, pred_result in input_data.items():
                if pred_result and isinstance(pred_result, str):
                    # Handle AI-generated content
                    if not any(error_word in pred_result.lower() for error_word in 
                              ["failed", "error", "not implemented", "sent successfully", "uploaded", "generated:"]) and \
                       len(pred_result.strip()) > 10:
                        
                        # Use AI response as social media content
                        if not enhanced_content or enhanced_content == "":
                            enhanced_content = pred_result[:280]  # Limit for Twitter
                        else:
                            # Append AI content to existing content
                            enhanced_content += f"\n\n{pred_result[:200]}"
                        
                        print(f"📝 Added AI content to social media post")
                    
                    # Handle Image generation results
                    elif "Image generated:" in pred_result:
                        image_path_from_ai = pred_result.split("Image generated: ")[-1]
                        if os.path.exists(image_path_from_ai):
                            final_image_path = image_path_from_ai
                            print(f"🎨 Using AI-generated image for social media post")
                    
                    # Handle Document parsing results for content
                    elif "Document parsed:" in pred_result:
                        json_path = pred_result.split("Document parsed: ")[-1]
                        try:
                            with open(json_path, 'r', encoding='utf-8') as f:
                                parsed_data = json.load(f)
                        
                            doc_content = parsed_data.get('content', '')
                            if doc_content and not enhanced_content:
                                # Use document summary as content
                                summary = doc_content[:250] + "..." if len(doc_content) > 250 else doc_content
                                enhanced_content = f"📄 Document Summary: {summary}"
                                print(f"📄 Using document content for social media post")
                        except Exception as e:
                            print(f"Error reading parsed document for social media: {str(e)}")
            
            # Update node data with enhanced content
            updated_data = {
                **node.data,
                "platform": platform,
                "content": enhanced_content,
                "image_path": final_image_path,
                "webhook_url": webhook_url
            }
            
            return await run_social_media_node(updated_data)
        else:
            return f"{node.type} node not implemented"
    except Exception as e:
        error_msg = f"Error executing {node.type} node {node.id}: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg
