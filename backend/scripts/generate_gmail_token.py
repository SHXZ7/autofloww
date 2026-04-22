import argparse
import json
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow


def main() -> None:
    backend_dir = Path(__file__).resolve().parents[1]

    parser = argparse.ArgumentParser(
        description="Generate Gmail OAuth token JSON (includes refresh_token)"
    )
    parser.add_argument(
        "--credentials",
        default=str(backend_dir / "credentials.json"),
        help="Path to Google OAuth client credentials JSON",
    )
    parser.add_argument(
        "--output",
        default=str(backend_dir / "gmail_token.json"),
        help="Output path for Gmail token JSON",
    )
    parser.add_argument(
        "--scope",
        choices=["readonly", "modify"],
        default="readonly",
        help="Gmail scope: readonly (recommended) or modify",
    )
    args = parser.parse_args()

    credentials_path = Path(args.credentials)
    output_path = Path(args.output)

    if not credentials_path.exists():
        raise SystemExit(f"Credentials file not found: {credentials_path}")

    scopes = [
        "https://www.googleapis.com/auth/gmail.readonly"
        if args.scope == "readonly"
        else "https://www.googleapis.com/auth/gmail.modify"
    ]

    print("Starting Google OAuth flow...")
    print("A browser window will open. Sign in with the Gmail account you want to listen to.")

    flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), scopes)
    creds = flow.run_local_server(
        host="localhost",
        port=0,
        prompt="consent",
        access_type="offline",
        include_granted_scopes="true",
    )

    token_json = json.loads(creds.to_json())
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(token_json, indent=2), encoding="utf-8")

    has_refresh = bool(token_json.get("refresh_token"))
    print(f"Token saved to: {output_path}")
    print(f"Refresh token present: {has_refresh}")

    if not has_refresh:
        print("Warning: refresh_token missing. Re-run and ensure consent is shown.")


if __name__ == "__main__":
    main()
