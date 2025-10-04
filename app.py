import sys
import os

# Add backend to sys.path so 'app' can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

# Import the FastAPI app
from backend.app.main import app
