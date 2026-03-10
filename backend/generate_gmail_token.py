"""
Run this script ONCE locally to generate gmail_token.json.
Then commit that file — the HF Space will use it to send emails via Gmail API.

Usage:
    cd backend
    python generate_gmail_token.py
"""
from google_auth_oauthlib.flow import InstalledAppFlow
import os

SCOPES = ['https://www.googleapis.com/auth/gmail.send']
CREDENTIALS_FILE = os.path.join(os.path.dirname(__file__), 'credentials.json')
TOKEN_FILE = os.path.join(os.path.dirname(__file__), 'gmail_token.json')

if not os.path.exists(CREDENTIALS_FILE):
    print("❌ credentials.json not found in backend/")
    print("   Download it from Google Cloud Console > APIs & Services > Credentials")
    exit(1)

flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
creds = flow.run_local_server(port=0)

with open(TOKEN_FILE, 'w') as f:
    f.write(creds.to_json())

print(f"✅ gmail_token.json created successfully!")
print(f"   Now commit it: git add backend/gmail_token.json && git commit -m 'add gmail token'")
print(f"   Then push to HF: git push hf main")
