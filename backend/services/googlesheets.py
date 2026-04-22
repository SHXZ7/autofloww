from __future__ import print_function
import os
import json
from typing import List, Any, Optional

# Try to import Google Sheets dependencies
try:
    from googleapiclient.discovery import build
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False


def _is_truthy(value: Optional[str]) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _allow_server_fallback() -> bool:
    explicit = os.getenv("ALLOW_SERVER_KEY_FALLBACK")
    if explicit is not None:
        return _is_truthy(explicit)

    app_env = os.getenv("APP_ENV", "development").strip().lower()
    return app_env not in {"prod", "production"}


def write_to_sheet(
    spreadsheet_id: str,
    range_name: str,
    values: List[List[Any]],
    token_json: Optional[str] = None,
) -> str:
    """Write data to Google Sheets"""
    if not GOOGLE_AVAILABLE:
        return "Error: Google Sheets API not available. Install with: pip install google-api-python-client google-auth google-auth-oauthlib"
    
    try:
        # Use the same token file as file upload for consistency
        SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
        backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        TOKEN_FILE = os.path.join(backend_root, "sheets_token.json")
        CREDENTIALS_FILE = os.path.join(backend_root, "credentials.json")
        
        print(f"📊 Writing to Google Sheet: {spreadsheet_id}")
        print(f"📋 Range: {range_name}")
        print(f"📝 Data rows: {len(values)}")
        
        creds = None
        if token_json:
            try:
                token_data = json.loads(token_json) if isinstance(token_json, str) else token_json
                creds = Credentials.from_authorized_user_info(token_data, SCOPES)
                print("Loaded user Google token from API keys")
            except Exception as e:
                return f"Error: Invalid user Google token JSON: {str(e)}"
        elif os.path.exists(TOKEN_FILE):
            print("Loading existing Sheets token...")
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                print("Refreshing expired token...")
                try:
                    creds.refresh(Request())
                    print("Token refreshed successfully")
                except Exception as e:
                    print(f"Token refresh failed: {e}")
                    if not token_json and os.path.exists(TOKEN_FILE):
                        os.remove(TOKEN_FILE)
                    creds = None
            
            if not creds:
                if token_json or not _allow_server_fallback():
                    return "Error: Missing/invalid user Google token. Add google_token_json in Settings > API Keys."

                print("Starting new OAuth flow...")
                if not os.path.exists(CREDENTIALS_FILE):
                    return "Error: credentials.json file not found. Please download it from Google Cloud Console and ensure Google Sheets API is enabled."
                
                flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
                creds = flow.run_local_server(port=0)
                print("OAuth flow completed successfully")
            
            if not token_json:
                with open(TOKEN_FILE, 'w') as token:
                    token.write(creds.to_json())
                    print("Token saved successfully")
        
        print("Building Sheets service...")
        service = build('sheets', 'v4', credentials=creds)
        
        # Prepare the request body
        body = {
            'values': values
        }
        
        print("Writing data to sheet...")
        result = service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption='RAW',
            body=body
        ).execute()
        
        updated_cells = result.get('updatedCells', 0)
        print(f"✅ Successfully updated {updated_cells} cells in Google Sheets")
        
        return f"Google Sheets updated successfully. {updated_cells} cells updated."
        
    except Exception as e:
        error_msg = f"Google Sheets write failed: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg

async def run_google_sheets_node(node_data):
    """Run Google Sheets node"""
    try:
        spreadsheet_id = node_data.get("spreadsheet_id", "")
        range_name = node_data.get("range", "Sheet1!A1")
        values = node_data.get("values", [])
        
        if not spreadsheet_id:
            return "Error: Spreadsheet ID is required"
        
        if not values:
            return "Error: No data provided to write to sheet"
        
        # Ensure values is a 2D array
        if isinstance(values, list) and values and not isinstance(values[0], list):
            values = [values]  # Convert 1D to 2D
        
        result = write_to_sheet(
            spreadsheet_id,
            range_name,
            values,
            token_json=node_data.get("google_token_json"),
        )
        return result
        
    except Exception as e:
        error_msg = f"Google Sheets node error: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg
