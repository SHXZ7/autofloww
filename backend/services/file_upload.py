import os
import io
import time
import mimetypes
import json
from datetime import datetime
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request


def _backend_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def _is_truthy(value: str) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _allow_server_fallback() -> bool:
    explicit = os.getenv("ALLOW_SERVER_KEY_FALLBACK")
    if explicit is not None:
        return _is_truthy(explicit)

    app_env = os.getenv("APP_ENV", "development").strip().lower()
    return app_env not in {"prod", "production"}


def _load_drive_credentials(scopes, token_json=None):
    drive_paths = _drive_paths()
    token_file = drive_paths["token"]
    credentials_file = drive_paths["credentials"]

    creds = None
    if token_json:
        token_data = json.loads(token_json) if isinstance(token_json, str) else token_json
        creds = Credentials.from_authorized_user_info(token_data, scopes)
    elif os.path.exists(token_file):
        print("🔑 Loading existing Drive token...")
        creds = Credentials.from_authorized_user_file(token_file, scopes)

    if creds and not creds.valid:
        if creds.expired and creds.refresh_token:
            print("🔄 Refreshing expired token...")
            creds.refresh(Request())
            print("✅ Token refreshed successfully")
            if not token_json:
                with open(token_file, 'w') as token:
                    token.write(creds.to_json())
        else:
            creds = None

    if not creds:
        if token_json or not _allow_server_fallback():
            raise Exception("Missing/invalid user Google token. Add google_token_json in Settings > API Keys.")

        print("🚀 Starting new OAuth flow...")
        if not os.path.exists(credentials_file):
            raise FileNotFoundError(
                "credentials.json file not found. Please download it from Google Cloud Console and make sure Google Drive API is enabled."
            )

        flow = InstalledAppFlow.from_client_secrets_file(credentials_file, scopes)
        creds = flow.run_local_server(port=0)
        print("✅ OAuth flow completed successfully")
        with open(token_file, 'w') as token:
            token.write(creds.to_json())
            print("💾 Token saved successfully")

    return creds


def _drive_paths():
    root = _backend_root()
    return {
        "token": os.path.join(root, "drive_token.json"),
        "credentials": os.path.join(root, "credentials.json"),
        "downloads": os.path.join(root, "downloads"),
    }

async def upload_to_drive(file_path, file_name, mime_type, token_json=None):
    # Validate file exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    try:
        # Use Google Drive specific scopes
        SCOPES = ['https://www.googleapis.com/auth/drive.file']
        
        print(f"📁 Attempting to upload file: {file_path}")
        print(f"📝 File name: {file_name}, MIME type: {mime_type}")
        print(f"📊 File size: {os.path.getsize(file_path) / 1024:.1f} KB")
        
        creds = _load_drive_credentials(SCOPES, token_json=token_json)
        
        print("🔧 Building Drive service...")
        service = build('drive', 'v3', credentials=creds)

        # Set file metadata with better naming
        if not file_name:
            file_name = os.path.basename(file_path)
        
        file_metadata = {
            'name': file_name,
            'description': f'Uploaded via AutoFlow on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
        }
        
        # Auto-detect MIME type if not provided
        if not mime_type:
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                mime_type = 'application/octet-stream'
        
        media = MediaFileUpload(file_path, mimetype=mime_type)

        print("☁️ Uploading file to Google Drive...")
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink, webContentLink, mimeType, size'
        ).execute()
        
        file_id = file.get('id')
        file_url = file.get('webViewLink')
        file_size = file.get('size', 0)
        
        print(f"✅ File uploaded successfully!")
        print(f"📁 File ID: {file_id}")
        print(f"🔗 View URL: {file_url}")
        print(f"📊 Size: {int(file_size) / 1024:.1f} KB" if file_size else "Size: Unknown")

        # Keep local file for potential document parsing workflows
        print("📂 Local file kept for potential document parsing")

        return {
            "file_id": file_id,
            "file_url": file_url,
            "file_size": file_size,
            "mime_type": file.get('mimeType', mime_type),
            "success": True
        }
    
    except FileNotFoundError as e:
        error_msg = f"File not found: {str(e)}"
        print(f"❌ {error_msg}")
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Google Drive upload failed: {str(e)}"
        print(f"❌ {error_msg}")
        print(f"🔍 Error type: {type(e)}")
        raise Exception(error_msg)


async def download_from_drive(file_id: str, custom_filename: str = None, token_json=None) -> str:
    """Enhanced download with better error handling and file naming."""
    try:
        # Use the same credentials as upload
        SCOPES = ['https://www.googleapis.com/auth/drive.file']
        drive_paths = _drive_paths()
        
        print(f"📥 Starting enhanced download for file ID: {file_id}")
        
        creds = _load_drive_credentials(SCOPES, token_json=token_json)
        
        print("🔧 Building Drive service...")
        service = build('drive', 'v3', credentials=creds)
        
        # Get file metadata first
        try:
            print("📋 Fetching file metadata...")
            file_metadata = service.files().get(
                fileId=file_id, 
                fields='name,mimeType,size,createdTime,modifiedTime,owners'
            ).execute()
            
            original_name = file_metadata.get('name', f'downloaded_{file_id}')
            file_name = custom_filename or original_name
            mime_type = file_metadata.get('mimeType')
            file_size = file_metadata.get('size')
            created_time = file_metadata.get('createdTime')
            owners = file_metadata.get('owners', [])
            
            print(f"📄 File Details:")
            print(f"   Name: {original_name}")
            print(f"   Type: {mime_type}")
            print(f"   Size: {file_size} bytes" if file_size else "   Size: Unknown")
            print(f"   Created: {created_time}")
            print(f"   Owner: {owners[0].get('displayName', 'Unknown') if owners else 'Unknown'}")
            
        except Exception as e:
            print(f"⚠️ Error getting file metadata: {str(e)}")
            file_name = custom_filename or f'downloaded_{file_id}'
            mime_type = None
            print(f"📄 Using fallback filename: {file_name}")
        
        # Store downloads under backend/downloads for stable local/cloud behavior.
        downloads_dir = drive_paths["downloads"]
        timestamp_dir = os.path.join(downloads_dir, datetime.now().strftime('%Y%m%d'))
        os.makedirs(timestamp_dir, exist_ok=True)
        
        # Ensure safe filename
        safe_filename = "".join(c for c in file_name if c.isalnum() or c in "._- ").rstrip()
        if not safe_filename:
            safe_filename = f"downloaded_{file_id}"
        
        local_path = os.path.join(timestamp_dir, safe_filename)
        
        # Handle potential filename conflicts
        counter = 1
        original_path = local_path
        while os.path.exists(local_path):
            name, ext = os.path.splitext(original_path)
            local_path = f"{name}_{counter}{ext}"
            counter += 1
        
        print(f"📂 Download destination: {local_path}")
        
        # Handle Google Workspace files (need export)
        if mime_type and 'google-apps' in mime_type:
            print("🔄 Detected Google Workspace file - using export method")
            local_path = await _export_google_workspace_file(service, file_id, safe_filename, mime_type, timestamp_dir)
        else:
            # Regular file download
            print("📥 Starting regular file download...")
            request = service.files().get_media(fileId=file_id)
            
            # Download with progress tracking
            total_size = int(file_size) if file_size else 0
            downloaded = 0
            
            with open(local_path, 'wb') as local_file:
                downloader = MediaIoBaseDownload(local_file, request)
                done = False
                while not done:
                    status, done = downloader.next_chunk()
                    if status:
                        progress = int(status.progress() * 100)
                        if total_size > 0:
                            downloaded = int(status.progress() * total_size)
                            print(f"📥 Download progress: {progress}% ({downloaded / 1024:.1f} KB / {total_size / 1024:.1f} KB)")
                        else:
                            print(f"📥 Download progress: {progress}%")
        
        # Verify download
        if os.path.exists(local_path):
            actual_size = os.path.getsize(local_path)
            print(f"✅ Download completed successfully!")
            print(f"📁 Local file: {local_path}")
            print(f"📊 File size: {actual_size / 1024:.1f} KB")
            
            # Verify file integrity if possible
            if file_size and int(file_size) != actual_size:
                print(f"⚠️ Warning: File size mismatch! Expected: {file_size}, Got: {actual_size}")
            
            return local_path
        else:
            raise Exception("Download completed but file not found at expected location")
        
    except Exception as e:
        error_msg = f"Enhanced download from Drive failed: {str(e)}"
        print(f"❌ {error_msg}")
        return None

async def _export_google_workspace_file(service, file_id: str, file_name: str, mime_type: str, download_dir: str) -> str:
    """Export Google Workspace files to downloadable formats with enhanced error handling."""
    try:
        print(f"🔄 Exporting Google Workspace file: {mime_type}")
        
        # Define export formats with fallbacks
        export_formats = {
            'application/vnd.google-apps.document': {
                'primary': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'fallback': 'application/pdf',
                'extension': '.docx',
                'fallback_ext': '.pdf'
            },
            'application/vnd.google-apps.spreadsheet': {
                'primary': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'fallback': 'text/csv',
                'extension': '.xlsx',
                'fallback_ext': '.csv'
            },
            'application/vnd.google-apps.presentation': {
                'primary': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'fallback': 'application/pdf',
                'extension': '.pptx',
                'fallback_ext': '.pdf'
            },
            'application/vnd.google-apps.drawing': {
                'primary': 'application/pdf',
                'fallback': 'image/png',
                'extension': '.pdf',
                'fallback_ext': '.png'
            },
            'application/vnd.google-apps.form': {
                'primary': 'application/pdf',
                'fallback': 'text/plain',
                'extension': '.pdf',
                'fallback_ext': '.txt'
            }
        }
        
        format_info = export_formats.get(mime_type)
        if not format_info:
            raise Exception(f"Cannot export Google Workspace file type: {mime_type}")
        
        # Try primary export format first
        export_mime = format_info['primary']
        extension = format_info['extension']
        
        # Add appropriate extension if not present
        if not file_name.lower().endswith(extension.lower()):
            file_name = os.path.splitext(file_name)[0] + extension
        
        local_path = os.path.join(download_dir, file_name)
        
        try:
            print(f"📤 Attempting export to {export_mime}")
            request = service.files().export_media(fileId=file_id, mimeType=export_mime)
            
            with open(local_path, 'wb') as local_file:
                downloader = MediaIoBaseDownload(local_file, request)
                done = False
                while not done:
                    status, done = downloader.next_chunk()
                    if status:
                        progress = int(status.progress() * 100)
                        print(f"📤 Export progress: {progress}%")
            
            print(f"✅ Successfully exported to {export_mime}")
            
        except Exception as primary_error:
            print(f"⚠️ Primary export failed: {str(primary_error)}")
            print(f"🔄 Trying fallback format: {format_info['fallback']}")
            
            # Try fallback format
            export_mime = format_info['fallback']
            extension = format_info['fallback_ext']
            
            # Update filename with fallback extension
            file_name = os.path.splitext(file_name)[0] + extension
            local_path = os.path.join(download_dir, file_name)
            
            request = service.files().export_media(fileId=file_id, mimeType=export_mime)
            
            with open(local_path, 'wb') as local_file:
                downloader = MediaIoBaseDownload(local_file, request)
                done = False
                while not done:
                    status, done = downloader.next_chunk()
                    if status:
                        progress = int(status.progress() * 100)
                        print(f"📤 Fallback export progress: {progress}%")
            
            print(f"✅ Successfully exported to fallback format: {export_mime}")
        
        return local_path
        
    except Exception as e:
        print(f"❌ Google Workspace export failed: {str(e)}")
        raise Exception(f"Failed to export Google Workspace file: {str(e)}")

async def get_drive_file_info(file_id: str, token_json=None) -> dict:
    """Get detailed information about a Google Drive file without downloading it."""
    try:
        # Use the same credentials as other Drive operations
        SCOPES = ['https://www.googleapis.com/auth/drive.file']
        creds = _load_drive_credentials(SCOPES, token_json=token_json)
        
        service = build('drive', 'v3', credentials=creds)
        
        # Get comprehensive file metadata
        file_metadata = service.files().get(
            fileId=file_id,
            fields='id,name,mimeType,size,createdTime,modifiedTime,owners,parents,shared,webViewLink,webContentLink,thumbnailLink,description'
        ).execute()
        
        return {
            "success": True,
            "file_info": {
                "id": file_metadata.get('id'),
                "name": file_metadata.get('name'),
                "mimeType": file_metadata.get('mimeType'),
                "size": file_metadata.get('size'),
                "createdTime": file_metadata.get('createdTime'),
                "modifiedTime": file_metadata.get('modifiedTime'),
                "owners": file_metadata.get('owners', []),
                "webViewLink": file_metadata.get('webViewLink'),
                "webContentLink": file_metadata.get('webContentLink'),
                "thumbnailLink": file_metadata.get('thumbnailLink'),
                "description": file_metadata.get('description'),
                "isGoogleWorkspace": 'google-apps' in file_metadata.get('mimeType', ''),
                "downloadable": True
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to get file info: {str(e)}"
        }

async def cleanup_old_downloads(days_old: int = 7) -> dict:
    """Clean up old downloaded files to save disk space."""
    try:
        downloads_dir = _drive_paths()["downloads"]
        if not os.path.exists(downloads_dir):
            return {"success": True, "message": "No downloads directory found"}
        
        current_time = time.time()
        cutoff_time = current_time - (days_old * 24 * 60 * 60)
        
        deleted_files = 0
        total_size_freed = 0
        
        for root, dirs, files in os.walk(downloads_dir):
            for file in files:
                file_path = os.path.join(root, file)
                file_stat = os.stat(file_path)
                
                if file_stat.st_mtime < cutoff_time:
                    file_size = file_stat.st_size
                    os.remove(file_path)
                    deleted_files += 1
                    total_size_freed += file_size
                    print(f"🗑️ Deleted old file: {file}")
        
        # Remove empty directories
        for root, dirs, files in os.walk(downloads_dir, topdown=False):
            for dir in dirs:
                dir_path = os.path.join(root, dir)
                try:
                    if not os.listdir(dir_path):  # Directory is empty
                        os.rmdir(dir_path)
                        print(f"🗑️ Removed empty directory: {dir}")
                except OSError:
                    pass  # Directory not empty or other error
        
        return {
            "success": True,
            "deleted_files": deleted_files,
            "size_freed_mb": round(total_size_freed / (1024 * 1024), 2),
            "message": f"Cleaned up {deleted_files} files, freed {round(total_size_freed / (1024 * 1024), 2)} MB"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Cleanup failed: {str(e)}"
        }


