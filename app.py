import sys
import os

# Add backend to sys.path so 'app' can be imported
backend_path = os.path.join(os.path.dirname(__file__), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Add services path
services_path = os.path.join(backend_path, "services")
if services_path not in sys.path:
    sys.path.insert(0, services_path)

# Import the FastAPI app
try:
    from backend.app.main import app
except ImportError as e:
    print(f"Import error: {e}")
    # Try alternative import path
    from backend.app.main import app
