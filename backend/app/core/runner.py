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
from services.document_parser import run_document_parser_node
from services.discord import run_discord_node
from services.report_generator import run_report_generator_node
from services.social_media import run_social_media_node
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
import json
from datetime import datetime

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

async def execute_node(node: Node, input_data: Dict[str, Any] = None) -> str:
    """Execute a single node based on its type"""
    if input_data is None:
        input_data = {}
    
    print(f"🔧 Executing {node.type} node: {node.id}")
    
    try:
        if node.type in ["gpt", "llama", "gemini", "claude", "mistral"]:
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
            
            for pred_id, pred_result in input_data.items():
                print(f"Checking predecessor {pred_id}: {pred_result}")
                
                # Handle report generation results
                if "Report generated:" in str(pred_result):
                    report_path = str(pred_result).split("Report generated: ")[-1]
                    if os.path.exists(report_path):
                        attachments.append({
                            "path": report_path,
                            "name": os.path.basename(report_path),
                            "type": "file"
                        })
                        email_body += f"\n\nGenerated report attached: {os.path.basename(report_path)}"
                        print(f"Added report attachment: {report_path}")
                
                # Handle file upload results
                elif "File uploaded:" in str(pred_result):
                    file_url = str(pred_result).split("File uploaded: ")[-1]
                    attachments.append({
                        "url": file_url,
                        "name": "uploaded_file",
                        "type": "url"
                    })
                    email_body += f"\n\nAttached file: {file_url}"
                    print(f"Added file attachment: {file_url}")
                
                # Handle image generation results
                elif "Image generated:" in str(pred_result):
                    image_path = str(pred_result).split("Image generated: ")[-1]
                    attachments.append({
                        "path": image_path,
                        "name": "generated_image",
                        "type": "file"
                    })
                    email_body += f"\n\nGenerated image attached"
                    print(f"Added image attachment: {image_path}")
                
                # Handle document parsing results
                elif "Document parsed:" in str(pred_result):
                    json_path = str(pred_result).split("Document parsed: ")[-1]
                    try:
                        with open(json_path, 'r', encoding='utf-8') as f:
                            parsed_data = json.load(f)
                        
                        # Add document content to email body
                        email_body += f"\n\n--- Parsed Document Content ---\n"
                        email_body += f"Document: {parsed_data.get('metadata', {}).get('file_name', 'Unknown')}\n"
                        email_body += f"Type: {parsed_data.get('type', 'Unknown')}\n\n"
                        
                        # Add the main content
                        if 'content' in parsed_data:
                            content = parsed_data['content']
                            # Limit content length for email
                            if len(content) > 2000:
                                content = content[:2000] + "... (truncated)"
                            email_body += content
                        
                        # Attach the JSON file
                        attachments.append({
                            "path": json_path,
                            "name": "parsed_document.json",
                            "type": "file"
                        })
                        
                        print(f"Added parsed document content to email")
                    except Exception as e:
                        email_body += f"\n\nError reading parsed document: {str(e)}"
                
                # Handle AI-generated content (summaries, analysis, etc.)
                elif any(ai_indicator in str(pred_result).lower() for ai_indicator in 
                        ["summary", "analysis", "conclusion", "response"]) and \
                     not any(error_word in str(pred_result).lower() for error_word in 
                            ["failed", "error", "not implemented"]):
                    # Add AI-generated content to email
                    email_body += f"\n\n--- AI Analysis ---\n"
                    email_body += str(pred_result)
                    print(f"Added AI analysis to email")

            print(f"Final attachments: {attachments}")
            
            # Update email data with attachments info
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
            if not file_path:
                return "Error: No file selected for upload. Please configure the file upload node with a file."
            
            # Check if there's an image from a connected image generation node
            for pred_id, pred_result in input_data.items():
                if "Image generated:" in str(pred_result):
                    # Extract the image file path
                    image_path = str(pred_result).split("Image generated: ")[-1]
                    if os.path.exists(image_path):
                        # Update file info with the generated image
                        file_info = {
                            "path": image_path,
                            "name": os.path.basename(image_path),
                            "mime_type": "image/png"
                        }
                        break
                elif "Image generated successfully" in str(pred_result):
                    # Handle base64 case - we need to get the actual file path
                    # This should be fixed in the image generation service
                    return "File upload failed: Image generation returned base64 data instead of file path"
            
            # Validate file exists before upload
            final_file_path = file_info.get("path", "")
            if not final_file_path or not os.path.exists(final_file_path):
                return f"Error: File not found at path: {final_file_path}. Please upload a file first."
            
            try:
                result = await upload_to_drive(
                    file_info.get("path", ""),
                    file_info.get("name", ""),
                    file_info.get("mime_type", "")
                )
                return f"File uploaded: {result['file_url']}"
            except Exception as e:
                return f"File upload failed: {str(e)}"
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
            return await run_document_parser_node(updated_node_data)
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

async def run_workflow_engine(nodes: List[Node], edges: List[Edge]) -> Dict[str, Any]:
    
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

    results = {}

    for node_id in execution_order:
        node: Node = G.nodes[node_id]["data"]
        input_data = {
            pred: results.get(pred)
            for pred in G.predecessors(node_id)
        }
        
        print(f"Executing node {node_id} ({node.type})")  # Debug log
        print(f"Input data for {node_id}: {input_data}")  # Debug log

        # Pass input data from connected nodes
        output = await execute_node(node, input_data)
        results[node_id] = output
        print(f"Node {node_id} result: {output}")  # Debug log

    return results
