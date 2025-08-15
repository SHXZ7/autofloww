from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import os
import io

async def upload_to_drive(file_path, file_name, mime_type):
    # Validate file exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    try:
        # Use Google Drive specific scopes
        SCOPES = ['https://www.googleapis.com/auth/drive.file']
        TOKEN_FILE = "drive_token.json"  # Separate token file for Drive
        CREDENTIALS_FILE = "credentials.json"
        
        print(f"Attempting to upload file: {file_path}")
        print(f"File name: {file_name}, MIME type: {mime_type}")
        
        creds = None
        if os.path.exists(TOKEN_FILE):
            print("Loading existing Drive token...")
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                print("Refreshing expired token...")
                try:
                    creds.refresh(Request())
                    print("Token refreshed successfully")
                except Exception as e:
                    print(f"Token refresh failed: {e}")
                    # Delete the invalid token file
                    if os.path.exists(TOKEN_FILE):
                        os.remove(TOKEN_FILE)
                    creds = None
            
            if not creds:
                print("Starting new OAuth flow...")
                if not os.path.exists(CREDENTIALS_FILE):
                    raise FileNotFoundError("credentials.json file not found. Please download it from Google Cloud Console and make sure Google Drive API is enabled.")
                
                flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
                creds = flow.run_local_server(port=0)
                print("OAuth flow completed successfully")
            
            # Save the credentials for the next run
            with open(TOKEN_FILE, 'w') as token:
                token.write(creds.to_json())
                print("Token saved successfully")
        
        print("Building Drive service...")
        service = build('drive', 'v3', credentials=creds)

        file_metadata = {'name': file_name}
        media = MediaFileUpload(file_path, mimetype=mime_type)

        print("Uploading file to Google Drive...")
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink'
        ).execute()
        
        print(f"File uploaded successfully. ID: {file.get('id')}")

        # Don't clean up uploaded file immediately for document parsing workflows
        # Comment out the cleanup for now to allow document parsing
        # try:
        #     os.remove(file_path)
        #     print("Local file cleaned up")
        # except Exception as cleanup_error:
        #     print(f"Cleanup warning: {cleanup_error}")
        
        print("Local file kept for potential document parsing")

        return {
            "file_id": file.get("id"),
            "file_url": file.get("webViewLink")
        }
    
    except Exception as e:
        print(f"Full error details: {str(e)}")
        print(f"Error type: {type(e)}")
        raise Exception(f"Google Drive upload failed: {str(e)}")


async def download_from_drive(file_id: str) -> str:
    """Download a file from Google Drive using its file ID"""
    try:
        # Use the same credentials as upload
        SCOPES = ['https://www.googleapis.com/auth/drive.file']
        TOKEN_FILE = "drive_token.json"
        CREDENTIALS_FILE = "credentials.json"
        
        print(f"Downloading file with ID: {file_id}")
        
        creds = None
        if os.path.exists(TOKEN_FILE):
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
                creds = flow.run_local_server(port=0)
            
            with open(TOKEN_FILE, 'w') as token:
                token.write(creds.to_json())
        
        service = build('drive', 'v3', credentials=creds)
        
        # Get file metadata
        file_metadata = service.files().get(fileId=file_id).execute()
        file_name = file_metadata.get('name', f'downloaded_{file_id}')
        
        # Download file content
        request = service.files().get_media(fileId=file_id)
        
        # Save to local file
        downloads_dir = "downloads"
        os.makedirs(downloads_dir, exist_ok=True)
        local_path = os.path.join(downloads_dir, file_name)
        
        with open(local_path, 'wb') as local_file:
            downloader = MediaIoBaseDownload(local_file, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
        
        print(f"Downloaded {file_name} to {local_path}")
        return local_path
    
    except Exception as e:
        print(f"Download from Drive failed: {str(e)}")
        return None
