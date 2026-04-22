import json
import os
from typing import Any, Dict, Optional

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build


def _load_credentials(token_json: Optional[str]) -> Optional[Credentials]:
    """Load Gmail credentials from user token JSON or fallback token file."""
    scopes = ["https://www.googleapis.com/auth/gmail.readonly"]

    creds: Optional[Credentials] = None

    if token_json:
        try:
            token_data = json.loads(token_json) if isinstance(token_json, str) else token_json
            creds = Credentials.from_authorized_user_info(token_data, scopes=scopes)
        except Exception as e:
            print(f"Gmail trigger: invalid user token JSON: {str(e)}")

    if not creds:
        backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        token_file = os.path.join(backend_root, "gmail_token.json")
        if os.path.exists(token_file):
            try:
                creds = Credentials.from_authorized_user_file(token_file, scopes=scopes)
            except Exception as e:
                print(f"Gmail trigger: failed reading fallback token file: {str(e)}")

    if creds and not creds.valid:
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                # Most common case is invalid_grant (revoked/expired refresh token).
                # Return None so caller can treat as "not armed" instead of hard crash.
                print(f"Gmail trigger: token refresh failed: {str(e)}")
                return None
        else:
            return None

    return creds


def _extract_header(payload_headers: Any, header_name: str) -> str:
    for header in payload_headers or []:
        if header.get("name", "").lower() == header_name.lower():
            return header.get("value", "")
    return ""


async def fetch_latest_email_event(
    token_json: Optional[str],
    query: str = "",
    label: str = "INBOX",
) -> Optional[Dict[str, Any]]:
    """Fetch latest Gmail message metadata that matches node filters."""
    creds = _load_credentials(token_json)
    if not creds:
        print("Gmail trigger: credentials unavailable")
        return None

    try:
        service = build("gmail", "v1", credentials=creds)

        list_params: Dict[str, Any] = {
            "userId": "me",
            "maxResults": 1,
            "q": query or "",
        }
        if label:
            list_params["labelIds"] = [label]

        msg_list = service.users().messages().list(**list_params).execute()
        messages = msg_list.get("messages", [])
        if not messages:
            return None

        msg_id = messages[0].get("id")
        if not msg_id:
            return None

        msg = service.users().messages().get(
            userId="me",
            id=msg_id,
            format="metadata",
            metadataHeaders=["Subject", "From", "Date"],
        ).execute()

        payload = msg.get("payload", {})
        headers = payload.get("headers", [])

        subject = _extract_header(headers, "Subject")
        sender = _extract_header(headers, "From")
        date_header = _extract_header(headers, "Date")
        snippet = msg.get("snippet", "")

        return {
            "message_id": msg_id,
            "thread_id": msg.get("threadId", ""),
            "subject": subject,
            "from": sender,
            "date": date_header,
            "snippet": snippet,
            "query": query,
            "label": label,
        }
    except Exception as e:
        print(f"Gmail trigger: fetch failed: {str(e)}")
        return None


def format_email_event(event: Dict[str, Any]) -> str:
    if not event:
        return "Gmail trigger: no email event"

    subject = event.get("subject", "(no subject)")
    sender = event.get("from", "unknown sender")
    snippet = event.get("snippet", "")
    message_id = event.get("message_id", "")

    if snippet and len(snippet) > 240:
        snippet = snippet[:240] + "..."

    return (
        f"Gmail trigger fired. From: {sender}. Subject: {subject}. "
        f"Snippet: {snippet}. Message ID: {message_id}"
    )
